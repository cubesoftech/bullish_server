import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { investment_log, users } from "@prisma/client";
import { findUser, generateRandomString } from "../utils";

// create Q
export const distributeInvestmentProfitQueue = createQueue(
    workerNames.distributeInvestmentProfit
);

// create worker
createWorker(
    workerNames.distributeInvestmentProfit,
    async (job: Job) => {
        return await distributeInvestmentProfit({ job })
    },
)

// ---------- INITIALIZE ---------- //
// this will run if the server restarts
// sort here to place the newest on top
export async function initDistributeInvestmentProfit() {
    // get all pending investments
    const investmentLog = await prisma.investment_log.findMany({
        where: {
            status: "PENDING"
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    investmentLog.forEach(async (investment) => {
        await distributeInvestmentProfitQueueUpsertJobScheduler(investment)
    })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export async function distributeInvestmentProfitQueueUpsertJobScheduler(investment: investment_log) {
    return await distributeInvestmentProfitQueue.upsertJobScheduler(`distributeInvestmentProfit:${investment.id}`, {
        //pattern: '0 0 * * *', //every midnight
        // pattern: '0 0 1 * *', //every 1st day of the month
        // pattern: '*/1 * * * *', //every 1 minute
        pattern: '*/10 * * * *', //every 15 minutes / this is for testing only use the every midnight pattern above for production
    }, {
        data: {
            // pass only the investment id since data passed here don't change
            investmentId: investment.id
        },
        name: `distributeInvestmentProfit:${investment.id}`,
    })
}

// ---------- JOB HANDLER ---------- //
async function distributeInvestmentProfit({ job }: { job: Job }) {
    const { investmentId } = job.data;
    // get the investment
    const investment = await prisma.investment_log.findUnique({
        where: {
            id: investmentId,
            status: "PENDING"
        },
        include: {
            user: true,
            series: {
                include: {
                    periods: {
                        // sort to get the last period easily
                        orderBy: {
                            period: "desc"
                        }
                    },
                    rate: true,
                    peakSeason: true,
                }
            }
        }
    });

    if (!investment) {
        // remove from the job if not found or already completed
        await distributeInvestmentProfitQueue.removeJobScheduler(`distributeInvestmentProfit:${investmentId}`)
        return job.log(`Removing Investment with id ${investmentId} in job scheduler since it's not found or maybe it's already completed.`);
    }

    if (investment.user.isDeleted) {
        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                status: "FAILED", //failed due to account deletion
                updatedAt: new Date(),
            }
        })
        return job.log(`Cancelling job for ${investment.user.id} | ${investment.user.name}, because this account is deleted.`)
    }

    const now = new Date();

    const { series, payoutSchedule, investmentDuration } = investment
    const { peakSeason } = series
    const { peakSeasonStartMonth, peakSeasonEndMonth } = peakSeason!

    const lastPeriod = investmentDuration; // investmentDuration is in months
    // get the profit logs on this investment
    const profitLogs = await prisma.profit_log.findMany({
        where: {
            investmentLogId: investment.id
        },
        orderBy: {
            // newest first
            createdAt: "desc"
        }
    })

    // list of months for quarterly
    const quarterMonths = [3, 6, 9, 12];
    // expected profit distribution count
    let expectedProfitDistributionCount = 0
    // set expected profit distribution count based on the payout schedule of profit
    if (payoutSchedule === "WEEKLY") {
        expectedProfitDistributionCount = lastPeriod * 4;
        // weekly schedule must run every friday
        // --------------------------------------------------- //
        // commented out for testing purposes only
        // uncomment once testing is done
        // if (now.getDay() !== 5) {
        //     return job.log(`Cancelling job since it's not friday.`);
        // }
    } else if (payoutSchedule === "MONTHLY") {
        expectedProfitDistributionCount = lastPeriod;
        // monthy schedule must run every 1st day of the month
        // --------------------------------------------------- //
        // commented out for testing purposes only
        // uncomment once testing is done
        // if (now.getDate() !== 1) {
        //     return job.log(`Cancelling job since it's not the first day of the month.`);
        // }
    } else if (payoutSchedule === "QUARTERLY") {
        expectedProfitDistributionCount = lastPeriod / 3;
        // quarterly schedule must run every 1st day of the quarter
        // --------------------------------------------------- //
        // commented out for testing purposes only
        // uncomment once testing is done
        // if (!quarterMonths.includes(now.getMonth() + 1) || now.getDate() !== 1) {
        //     return job.log(`Cancelling job since it's not quarter year and 1st day of the month.`);
        // }
    }

    // check if the scheduler already distributed all the profit
    // if already distributed and still on pending then update the status
    if (profitLogs.length >= expectedProfitDistributionCount) {
        // update the investment status to completed
        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                status: "COMPLETED",
                updatedAt: new Date(),
            }
        })
        return job.log(`Investment ${investment.id} has already received all profit.`);
    }

    // predict the investment status on next run of the job
    const nextMonthInvestmentStatus: investment_log["status"] =
        profitLogs.length + 1 === expectedProfitDistributionCount
            ? "COMPLETED"
            : "PENDING";


    // add 1 day to the current date to check if today is the distribution day
    now.setDate(now.getDate() + 1); // add 1 day to the current date
    const currentMonth = now.getMonth() + 1; // add 1 since getMonth is zero based

    // get the monthsary of createdAt of investment
    const monthsary = new Date(
        new Date(investment.createdAt)
            .setMonth(
                new Date(investment.createdAt).getMonth() + 1
            )
    );
    // check if the investment is approved a month ago
    if (now < monthsary && payoutSchedule !== "WEEKLY") {
        return job.log(`Investment ${investment.id} is not yet eligible for profit distribution, now: ${now}, monthsary: ${monthsary}`);
    }

    // check if the profit is already distributed based on the scheduled profit distribution
    if (profitLogs.length > 0) {
        let lastProfitLogCreated = new Date(profitLogs[0].createdAt);
        // check if the last created profit logs is less that 7 days
        if (payoutSchedule === "WEEKLY" && now.getDate() - lastProfitLogCreated.getDate() < 7) {
            return job.log(`Investment ${investment.id} has already distributed profit for this week`);
        }
        // check if the last profit distribution is this month
        if (payoutSchedule === "MONTHLY" && lastProfitLogCreated.getMonth() + 1 === currentMonth) {
            return job.log(`Investment ${investment.id} has already distributed profit for this month.`);
        }
        // check if the last profit distribution is this quarter
        if (payoutSchedule === "QUARTERLY" && currentMonth - (lastProfitLogCreated.getMonth() + 1) < 3) {
            return job.log(`Investment ${investment.id} has already distributed profit for this quarter.`);
        }
    }

    let isOnPeakSeason: boolean = false;
    let settlementRate: number = 0;

    // check if the current month is within the peak season
    if (currentMonth >= peakSeasonStartMonth && currentMonth <= peakSeasonEndMonth) {
        isOnPeakSeason = true;
        settlementRate = investment.peakSettlementRate; //stored as decimal already
    } else {
        isOnPeakSeason = false;
        settlementRate = investment.leanSettlementRate; //stored as decimal already
    }

    const monthlyProfit = investment.amount * settlementRate
    let profit: number = 0

    // adjust the profit based on payout schedule
    if (payoutSchedule === "WEEKLY") {
        profit = monthlyProfit / 4;
    } else if (payoutSchedule === "MONTHLY") {
        profit = monthlyProfit;
    } else if (payoutSchedule === "QUARTERLY") {
        profit = monthlyProfit * 3;
    }

    profit *= (1 - 0.154); // deduct tax of 15.4%

    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate an async job to prevent rate-limiting

    try {
        await prisma.$transaction(async (tx) => {
            await tx.profit_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: investment.userId,
                    investmentLogId: investment.id,
                    seriesId: investment.seriesId,
                    profit: profit,
                    settlementRate,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
            await tx.investment_log.update({
                where: {
                    id: investment.id
                },
                data: {
                    status: nextMonthInvestmentStatus,
                    totalProfit: {
                        increment: profit
                    },
                    updatedAt: new Date(),
                }
            })
            await tx.users.update({
                where: {
                    id: investment.userId
                },
                data: {
                    balance: {
                        increment: profit
                    },
                    updatedAt: new Date(),
                }
            })
        })
        return job.log(`investment id: ${investment.id},
last period: ${lastPeriod},
created at: ${new Date(investment.createdAt).toLocaleDateString()},
user's payout scheduler: ${payoutSchedule},
investment status next payout: ${nextMonthInvestmentStatus},
investment monthsary: ${monthsary.toLocaleDateString()},
last distributed profit id: ${profitLogs[0]?.id || "N/A"}
is on peak season: ${isOnPeakSeason},
settlement rate: ${settlementRate},
profit for this payout: ${profit.toLocaleString()}`)
    } catch (error) {
        job.log(`Error occurred while distributing profit for investment ${investment.id}: ${error}`);
    }
};
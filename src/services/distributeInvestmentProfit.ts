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
export const distributeInvestmentProfitQueueUpsertJobScheduler = async (investment: investment_log) => {
    return await distributeInvestmentProfitQueue.upsertJobScheduler(`distributeInvestmentProfit:${investment.id}`, {
        pattern: '0 0 * * *', //every midnight
        // pattern: '0 0 1 * *', //every 1st day of the month
        // pattern: '*/1 * * * *', //every 1 minute
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

    const { series } = investment
    const { periods, rate, peakSeason } = series
    const { peakSeasonStartMonth, peakSeasonEndMonth } = peakSeason!

    const lastPeriod = periods[0].period; // get the last period
    const profitLogs = await prisma.profit_log.findMany({
        where: {
            investmentLogId: investment.id
        },
        orderBy: {
            // newest first
            createdAt: "desc"
        }
    })

    // if the profit logs are greater than or equal to the last period, mark the investment as completed
    if (profitLogs.length >= lastPeriod) {
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

    const nextMonthInvestmentStatus: investment_log["status"] =
        profitLogs.length + 1 === lastPeriod
            ? "COMPLETED"
            : "PENDING";

    // get the current date but add 1 day
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // add 1 since getMonth is zero based

    const monthsary = new Date(
        new Date(investment.createdAt)
            .setMonth(
                new Date(investment.createdAt).getMonth() + 1
            )
    );
    now.setDate(now.getDate() + 1); // add 1 day to the current date
    // check if today is monthsary
    if (now < monthsary) {
        return job.log(`Investment ${investment.id} is not yet eligible for profit distribution. Next schedule for profit distribution: ${monthsary.toLocaleDateString()}`);
    }

    // check if the profit is already distributed this month
    if (profitLogs.length > 0) {
        const lastProfitLogCreatedMonth = new Date(profitLogs[0].createdAt).getMonth() + 1;
        if (lastProfitLogCreatedMonth === currentMonth) {
            return job.log(`Investment ${investment.id} has already distributed profit for this month.`);
        }
    }

    let isOnPeakSeason: boolean = false;

    // check if the current month is within the peak season
    if (currentMonth >= peakSeasonStartMonth && currentMonth <= peakSeasonEndMonth) {
        isOnPeakSeason = true;
    } else {
        isOnPeakSeason = false;
    }

    const minRate = (rate?.minRate || 0) / 100; // convert minRate to decimal
    const settlementRate = minRate * (isOnPeakSeason ? 1.2 : 0.8);
    const monthlyProfit = Math.round(investment.amount * settlementRate)

    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate an async job to prevent rate-limiting

    try {
        await prisma.$transaction(async (tx) => {
            await tx.profit_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: investment.userId,
                    investmentLogId: investment.id,
                    seriesId: investment.seriesId,
                    profit: monthlyProfit,
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
                        increment: monthlyProfit
                    },

                }
            })
            await tx.users.update({
                where: {
                    id: investment.userId
                },
                data: {
                    balance: {
                        increment: monthlyProfit
                    }
                }
            })
        })
        return job.log(`
            investment id: ${investment.id},
            last period: ${lastPeriod},
            created at: ${new Date(investment.createdAt).toLocaleDateString()},
            investment status next month: ${nextMonthInvestmentStatus},
            investment monthsary: ${monthsary.toLocaleDateString()},
            last distributed profit id: ${profitLogs[0]?.id || "N/A"}
            is on peak season: ${isOnPeakSeason},
            min rate: ${minRate},
            settlement rate: ${settlementRate},
            profit for this month: ${monthlyProfit.toLocaleString()}
        `)
    } catch (error) {
        job.log(`Error occurred while distributing profit for investment ${investment.id}: ${error}`);
    }
};
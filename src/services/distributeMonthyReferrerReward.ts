import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { monthly_profit_log, monthly_referrer_profit_log, users } from "@prisma/client";
import { findUser, generateRandomString } from "../utils";
import { addDays, addMonths, differenceInMonths, startOfDay, subDays } from "date-fns";

export const distributeMonthlyReferrerRewardQueue = createQueue(
    workerNames.distributeMonthlyReferrerReward
);

createWorker(
    workerNames.distributeMonthlyReferrerReward,
    async (job: Job) => {
        return await distributeMonthlyReferrerReward({ job })
    },
)

// ---------- INITIALIZE ---------- //
export async function initDistributeMonthlyReferrerReward() {
    const users = await prisma.user_reached_referral_limit_log.findMany({
        include: {
            user: true
        }
    })

    users.forEach(async (user) => {
        await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(user.user)
    })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const distributeMonthlyReferrerRewardQueueUpsertJobScheduler = async (user: users) => {
    return await distributeMonthlyReferrerRewardQueue.upsertJobScheduler(`distributeMonthlyReferrerRewardQueue:${user.id}`, {
        pattern: '0 0 * * *', //every midnight
        // pattern: '0 0 1 * *', //every 1st day of the month
        // pattern: '*/2 * * * *', //every 1 minute
    }, {
        data: {
            // pass only the userId since data passed here don't change
            userId: user.id
        },
        name: `distributeMonthlyReferrerRewardQueue:${user.id} | ${user.phoneNumber} | ${user.name}`,
    })
}
// ---------- HANDLER ---------- //
async function distributeMonthlyReferrerReward({ job }: { job: Job }) {
    const { userId } = job.data;
    const user = await prisma.users.findUnique({
        where: {
            id: userId,
            status: true,
        },
        include: {
            referredInvestors: true
        }
    });

    // check if the user still exist/not deleted
    if (!user) {
        distributeMonthlyReferrerRewardQueue.removeJobScheduler(`distributeMonthlyReferrerRewardQueue:${userId}`);
        return job.log(`Removing user ${userId} since it's not found.`);
    }
    if (user.isDeleted) {
        return job.log(`Stopping profit distribution for user ${userId} since the account is deleted.`);
    }

    const { referredInvestors } = user
    const referralLimitReached = await prisma.user_reached_referral_limit_log.findUnique({
        where: {
            userId: user.id
        }
    })

    // double check if the user has reached referral limit
    if (!referralLimitReached || referredInvestors.length <= 20) {
        return job.log(`User ${user.id} has not referred enough investors to receive a monthly profit. Referred investors: ${referredInvestors.length}`);
    }

    const dateReachedReferralLimit = referralLimitReached.createdAt;
    let currentDate = new Date(
        addMonths(new Date(), 3)
    );

    const monthsSinceReachedReferralLimit = differenceInMonths(currentDate, dateReachedReferralLimit);

    // if reached referral limit less than a month ago, skip
    if (monthsSinceReachedReferralLimit < 1) {
        return job.log(`User ${user.id} reached referral limit less than a month ago on ${dateReachedReferralLimit} today is ${currentDate}. Skipping profit distribution.`);
    }

    // this time naka 1 months na siya
    if (dateReachedReferralLimit.getDate() !== currentDate.getDate()) {
        return job.log(`User ${user.id} reached referral limit on ${dateReachedReferralLimit.getDate()}. Today is ${currentDate.getDate()}`);
    }

    // get the last referral point log
    const referralPointLog = await prisma.monthly_referrer_profit_log.findMany({
        where: {
            userId: user.id,
            type: "REFERRER2",
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 1
    })

    let referralPointsSinceLastLog = 0;

    // if there is a last log, get the referred investors since the last log date
    if (referralPointLog.length > 0) {
        const lastReferralPointLog = referralPointLog[0];
        const lastLogDate = lastReferralPointLog.createdAt;

        // get referred user since the last log date
        const referredInvestorsSinceLastLog = await prisma.referred_investors_log.count({
            where: {
                referrerId: user.id,
                createdAt: {
                    gt: lastLogDate
                }
            }
        })

        if (referredInvestorsSinceLastLog <= 0) {
            return job.log(`User ${user.id} has not referred any investors since the last referral point log on ${lastLogDate}`);
        }

        referralPointsSinceLastLog = referredInvestorsSinceLastLog * 100_000;
    } else {

        // if there is no last log, get all referred investors since the dateReachedReferralLimit
        const referredInvestorSinceReachedReferralLimit = await prisma.referred_investors_log.count({
            where: {
                referrerId: user.id,
            }
        })

        if (referredInvestorSinceReachedReferralLimit <= 20) {
            return job.log(`User ${user.id} has not referred any investors since reaching the referral limit on ${dateReachedReferralLimit}`);
        }

        referralPointsSinceLastLog = (referredInvestorSinceReachedReferralLimit - 20) * 100_000;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work to avoid rate limiting
    try {
        await prisma.$transaction(async (tx) => {
            // distribute 2m on referrer monthly
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    referrerPoints: {
                        increment: referralPointsSinceLastLog
                    },
                    updatedAt: new Date()
                }
            })
            await tx.monthly_referrer_profit_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    amount: referralPointsSinceLastLog,
                    type: "REFERRER2",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })
        return job.log(`
            user: ${user.id} | ${user.phoneNumber} | ${user.name},
            profit: ${referralPointsSinceLastLog.toLocaleString()},
            type: "REFERRER2",
            `)
    } catch (error) {
        return job.log(`Error distributing referrer points for user ${user.id}: ${error}`);
    }
};
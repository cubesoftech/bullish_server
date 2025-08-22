import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { monthly_profit_log, monthly_referrer_profit_log, users } from "@prisma/client";
import { findUser, generateRandomString } from "../utils";

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
    const users = await prisma.users.findMany({
        where: {
            referredInvestors: {
                some: {}
            }
        },
        include: {
            referredInvestors: true
        }
    });

    const maxBaseSettlementRate = (0.1 / 100) * 20

    users
        .filter(
            user =>
                user.referredInvestors.length > 20
                && user.baseSettlementRate > maxBaseSettlementRate
        )

    users.forEach(async (user) => {
        await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(user)
    })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const distributeMonthlyReferrerRewardQueueUpsertJobScheduler = async (user: users) => {
    return await distributeMonthlyReferrerRewardQueue.upsertJobScheduler(`distributeMonthlyReferrerRewardQueue:${user.id}`, {
        // pattern: '0 0 * * *', //every midnight
        pattern: '0 0 1 * *', //every 1st day of the month
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
            id: userId
        },
        include: {
            referredInvestors: true
        }
    });

    if (!user) {
        distributeMonthlyReferrerRewardQueue.removeJobScheduler(`distributeMonthlyReferrerRewardQueue:${userId}`);
        return job.log(`Removing user ${userId} since it's not found.`);
    }

    const { referredInvestors } = user
    if (referredInvestors.length <= 20) {
        return job.log(`User ${user.id} has not referred enough investors to receive a monthly profit. Referred investors: ${referredInvestors.length}`);
    }

    const over20ReferredInvestors = referredInvestors.length - 20;
    const monthlyProfitBasedOnReferrals = 100_000 * over20ReferredInvestors

    if (over20ReferredInvestors <= 0) {
        return job.log(`User ${user.id} has not referred enough investors to receive a monthly profit. Referred investors: ${referredInvestors.length}`);
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
                        increment: monthlyProfitBasedOnReferrals
                    },
                    updatedAt: new Date()
                }
            })
            await tx.monthly_referrer_profit_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    amount: monthlyProfitBasedOnReferrals,
                    type: "REFERRER2",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })
        return job.log(`
            user: ${user.id} | ${user.phoneNumber} | ${user.name},
            profit: ${monthlyProfitBasedOnReferrals.toLocaleString()},
            type: "REFERRER2",
            `)
    } catch (error) {
        return job.log(`Error distributing referrer points for user ${user.id}: ${error}`);
    }
};
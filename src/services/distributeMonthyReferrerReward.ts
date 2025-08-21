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
    const users = await prisma.users.findMany();

    users.forEach(async (user) => {
        await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(user)
    })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const distributeMonthlyReferrerRewardQueueUpsertJobScheduler = async (user: users) => {
    return await distributeMonthlyReferrerRewardQueue.upsertJobScheduler(`distributeMonthlyReferrerRewardQueue:${user.id}`, {
        // pattern: '0 0 * * *', //every midnight
        pattern: '0 0 1 * *', //every 1st day of the month
        // pattern: '*/1 * * * *', //every 1 minute
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
        return job.log(`User ${userId} has less than 20 referred investors.`);
    }

    const logs: monthly_referrer_profit_log[] = [
        {
            id: generateRandomString(7),
            userId: user.id,
            amount: 2_000_000,
            type: "REFERRER2",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        ...referredInvestors.map(investor => ({
            id: generateRandomString(7),
            userId: investor.id,
            amount: 100_000,
            type: "REFERRER3",
            createdAt: new Date(),
            updatedAt: new Date(),
        }))
    ]

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
                        increment: 2_000_000
                    },
                    updatedAt: new Date()
                }
            })
            // distribute 100k on each referred investors
            await tx.users.updateMany({
                where: {
                    id: {
                        in: referredInvestors.map(investor => investor.id)
                    },
                },
                data: {
                    referrerPoints: {
                        increment: 100_000,
                    },
                    updatedAt: new Date(),
                }
            })
            // create logs
            await tx.monthly_referrer_profit_log.createMany({
                data: logs
            })
        })
        return job.log(`
            user: ${user.id} | ${user.phoneNumber} | ${user.name},
            profit: ${(2_000_000).toLocaleString()},
            type: "REFERRER2",
            referredInvestors: ${referredInvestors.map(investor => `
                user: ${investor.id} | ${investor.phoneNumber} | ${investor.name},
                profit: ${(100_000).toLocaleString()},
                type: "REFERRER3",
            `)}
            `)
    } catch (error) {
        return job.log(`Error distributing referrer points for user ${user.id}: ${error}`);
    }
};
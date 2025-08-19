import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { users } from "@prisma/client";
import { findUser, generateRandomString } from "../utils";

export const updateUserMonthlyProfitQueue = createQueue(
    workerNames.updateUserMonthlyProfit
);

createWorker(
    workerNames.updateUserMonthlyProfit,
    async (job: Job) => {
        return await updateUserMonthlyProfit({ job })
    },
)

// ---------- INITIALIZE ---------- //
export async function initUpdateUserMonthlyProfit() {
    // get only 1 user per profit to avoid duplicate jobs
    const profitLog = await prisma.profit_log.findMany({
        distinct: ["userId"],
        include: {
            user: true
        }
    })

    profitLog.forEach(async (log) => {
        await updateUserMonthlyProfitQueueUpsertJobScheduler(log.user)
    })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const updateUserMonthlyProfitQueueUpsertJobScheduler = async (user: users) => {
    return await updateUserMonthlyProfitQueue.upsertJobScheduler(`updateUserMonthlyProfitQueue:${user.id}`, {
        // pattern: '0 0 * * *', //every midnight
        // pattern: '0 0 1 * *', //every 1st day of the month
        pattern: '*/5 * * * *', //every 5 minutes
    }, {
        data: {
            // pass only the userId since data passed here don't change
            userId: user.id
        },
        name: `updateUserMonthlyProfitQueue:${user.id} | ${user.phoneNumber} | ${user.name}`,
    })
}
// ---------- HANDLER ---------- //
async function updateUserMonthlyProfit({ job }: { job: Job }) {
    const { userId } = job.data;
    const user = await findUser(userId);

    if (!user) {
        // remove from job if the user didn't exist
        await updateUserMonthlyProfitQueue.removeJobScheduler(`updateUserMonthlyProfitQueue:${userId}`)
        return job.log(`User with userId ${userId} not found.`);
    }

    // Get the date from a month ago
    const monthAgo = new Date();
    monthAgo.setMonth(
        new Date(monthAgo).getMonth() - 1
    )
    monthAgo.setDate(
        new Date(monthAgo).getDate() - 1
    )

    const profitLogs = await prisma.profit_log.aggregate({
        where: {
            userId: user.id,
            createdAt: {
                gte: monthAgo
            },
        },
        orderBy: {
            // newest on top
            createdAt: 'desc'
        },
        _sum: {
            profit: true,
        }
    })

    if (!profitLogs._sum.profit || profitLogs._sum.profit <= 0) {
        return job.log(`User ${user.id} | ${user.name} | ${user.phoneNumber} has no profit logs for the last month.`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work to avoid rate limiting

    try {
        await prisma.monthly_profit_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                amount: profitLogs._sum.profit,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })
        return job.log(`
            Created monthly profit log for user ${user.id}:
            time: ${new Date().toLocaleDateString()}
            profit: ${profitLogs._sum.profit}
            `)
    } catch (error) {
        return job.log(`Error updating monthly profit for user ${user.id}: ${error}`);
    }
};
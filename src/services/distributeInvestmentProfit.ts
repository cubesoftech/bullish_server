import { Queue, Worker, Job } from "bullmq";
import { workerNames, bullMqConnectionOptions } from "../utils/bullMq";
import { redisOptions } from "../utils/redis";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { users } from "@prisma/client";
import { findUser } from "../utils";

export const distributeInvestmentProfitQueue = createQueue(
    workerNames.distributeInvestmentProfit
);

createWorker(
    workerNames.distributeInvestmentProfit,
    async (job: Job) => {
        return await distributeInvestmentProfit({ job })
    },
)

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const distributeInvestmentProfitQueueUpsertJobScheduler = async (user: users) => {
    return await distributeInvestmentProfitQueue.upsertJobScheduler(`distributeInvestmentProfit:${user.id}`, {
        // pattern: '0 0 * * *', //every midnight
        pattern: '*/5 * * * *', //every 5 minutes
    }, {
        data: {
            // pass only the userId since data passed here don't change
            userId: user.id
        },
        name: `distributeInvestmentProfit:${user.id} | ${user.phoneNumber} | ${user.name}`,
    })
}

// ---------- INITIALIZE ---------- //
export async function initDistributeInvestmentProfit() {
    const users = await prisma.users.findMany()

    users.forEach(async (user) => {
        await distributeInvestmentProfitQueueUpsertJobScheduler(user)
    })
};

// ---------- HANDLER ---------- //
async function distributeInvestmentProfit({ job }: { job: Job }) {
    const { userId } = job.data;
    const user = await findUser(userId);

    if (!user) {
        return job.log(`User with userId ${userId} not found.`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work to avoid rate limiting
    job.log(`Distributing investment profit for user ${userId}`);
};
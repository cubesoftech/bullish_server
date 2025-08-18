import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { users } from "@prisma/client";
import { findUser } from "../utils";

export const updateUserMonthlyProfitQueue = createQueue(
    workerNames.updateUserMonthlyProfit
);

createWorker(
    workerNames.updateUserMonthlyProfit,
    async (job: Job) => {
        return await updateUserMonthlyProfit({ job })
    },
)

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

// ---------- INITIALIZE ---------- //
export async function initUpdateUserMonthlyProfit() {
    const users = await prisma.users.findMany()

    users.forEach(async (user) => {
        await updateUserMonthlyProfitQueueUpsertJobScheduler(user)
    })
};

// ---------- HANDLER ---------- //
async function updateUserMonthlyProfit({ job }: { job: Job }) {
    const dayMs = 1000 * 60 * 60 * 24;

    const { userId } = job.data;
    const user = await findUser(userId);

    if (!user) {
        return job.log(`User with userId ${userId} not found.`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work to avoid rate limiting
    const now = new Date();
    const monthsary = new Date(
        new Date(user.createdAt)
            .setMonth(
                new Date(user.createdAt).getMonth() + 1
            )
    );

    // check mo muna kung yung count ng profit para dun sa investment is <= sa last period ng investment
    // or you can just directly store sa database kung kailan ang last profit distribution
    // then store mo na din kung ilang beses dapat mabibigyan ng profit si user

    // if yung last profit is >= 1 month old then distribute a new profit
    const monthsOld = new Date().getMonth() - new Date(user.createdAt).getMonth();

    // log how many days since the account is created
    const daysSinceCreated = (now.getTime() - user.createdAt.getTime()) / dayMs;
    job.log(`User ${userId} has been a member for ${daysSinceCreated} days.`);

    // log how many months since the account is created
    const monthsSinceCreated = daysSinceCreated / 30;
    job.log(`User ${userId} has been a member for ${monthsSinceCreated} months.`);

    job.log(`User ${userId} has a monthsary on ${monthsary.toISOString()} because it is created on ${new Date(user.createdAt).toISOString()}.`);
    job.log(`User ${userId} is ${monthsOld} months old.`);
};
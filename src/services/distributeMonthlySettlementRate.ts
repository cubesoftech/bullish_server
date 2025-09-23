import { Job } from "bullmq";
import { workerNames } from "../utils/bullMq";
import { createQueue, createWorker } from "../utils/bullMq";
import { prisma } from "../utils/prisma";
import { findUser, generateRandomString } from "../utils";
import { users } from "@prisma/client";
import { distributeMonthlyReferrerRewardQueueUpsertJobScheduler } from "./distributeMonthyReferrerReward";

export const distributeMonthlySettlementRateQueue = createQueue(
    workerNames.distributeMonthlySettlementRate
);

createWorker(
    workerNames.distributeMonthlySettlementRate,
    async (job: Job) => {
        // return await distributeMonthlySettlementRate({ job })
    },
)

// ---------- INITIALIZE ---------- //
export async function initDistributeMonthlySettlementRate() {
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
                user.referredInvestors.length > 0
                && user.referredInvestors.length <= 20
                && user.baseSettlementRate <= maxBaseSettlementRate
        )
        .map(async (user) => {
            await distributeMonthlySettlementRateQueueUpsertJobScheduler(user)
        })
};

// ---------- UPSERT JOB QUEUE HELPER ---------- //
export const distributeMonthlySettlementRateQueueUpsertJobScheduler = async (user: users) => {
    return await distributeMonthlySettlementRateQueue.upsertJobScheduler(`distributeMonthlySettlementRateQueue:${user.id}`, {
        // pattern: '0 0 * * *', //every midnight
        pattern: '0 0 28-31 * *', //every last day of the month
        // pattern: '*/1 * * * *', //every 1 minute
    }, {
        data: {
            // pass only the userId since data passed here don't change
            userId: user.id
        },
        name: `distributeMonthlySettlementRateQueue:${user.id} | ${user.phoneNumber} | ${user.name}`,
    })
}
// ---------- HANDLER ---------- //
async function distributeMonthlySettlementRate({ job }: { job: Job }) {
    // check if today is the last day of the month
    const now = new Date();
    const isLastDayOfMonth = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (!isLastDayOfMonth) {
        return job.log(`Today is not the last day of the month. Skipping job distributeMonthlySettlementRate`);
    }

    const { userId } = job.data;
    const user = await prisma.users.findUnique({
        where: {
            id: userId
        },
        include: {
            referredInvestors: true
        }
    });

    // remove unnecessary users on the memory
    if (!user) {
        distributeMonthlySettlementRateQueue.removeJobScheduler(`distributeMonthlySettlementRateQueue:${userId}`);
        return job.log(`Removing user ${userId} since it's not found.`);
    }

    const { referredInvestors } = user
    // make sure the user referred an investor
    if (referredInvestors.length <= 0) {
        distributeMonthlySettlementRateQueue.removeJobScheduler(`distributeMonthlySettlementRateQueue:${userId}`);
        return job.log(`Removing user ${user.id} fow now, because it has no referred investors`);
    }

    // if the user already reached the max base settlement rate transfer it to monthly referrer point reward instead
    const maxBaseSettlementRate = (0.1 / 100) * 20
    if (user.baseSettlementRate >= maxBaseSettlementRate) {
        distributeMonthlySettlementRateQueue.removeJobScheduler(`distributeMonthlySettlementRateQueue:${userId}`);
        await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(user)
        return job.log(`Transfering user ${user.id} from distributeMonthlySettlementRate to distributeMonthlyReferrerReward, because it already referred more than 20 investors.`)
    }

    let baseSettlementRateForThisMonth = (0.1 / 100) * referredInvestors.length;

    if (baseSettlementRateForThisMonth > maxBaseSettlementRate) {
        await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(user)
        job.log(`Adding user ${user.id} to distributeMonthlyReferrerRewardQueue, because it already referred more than 20 investors.`)
    }
    // make sure the user's base settlement rate dont exceed the quota
    if (referredInvestors.length > 20) {
        baseSettlementRateForThisMonth = maxBaseSettlementRate;
    }

    const baseSettlementRateForLog = baseSettlementRateForThisMonth - user.baseSettlementRate


    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work to avoid rate limiting
    try {
        await prisma.$transaction(async (tx) => {
            // distribute 2m on referrer monthly
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    baseSettlementRate: baseSettlementRateForThisMonth, //already converted to decimal in formula above
                    updatedAt: new Date()
                }
            })
            await tx.monthly_referrer_profit_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    amount: baseSettlementRateForLog,
                    type: "REFERRER1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })
        return job.log(`
            user: ${user.id} | ${user.phoneNumber} | ${user.name},
            total settlement rate: ${baseSettlementRateForThisMonth}
            settlement rate for this month: ${baseSettlementRateForLog}
            type: "REFERRER1",
            `)
    } catch (error) {
        return job.log(`Error distributing referrer points for user ${user.id}: ${error}`);
    }
};
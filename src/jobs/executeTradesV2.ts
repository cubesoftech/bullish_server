import { Job } from "bullmq";
import { bullMqWorkerNames, createQueue, createWorker } from "../helpers/bullMq";
import prisma from "../helpers/prisma";
import { membertrades } from "@prisma/client";

// create Q
export const executeTradesV2Queue = createQueue(
    bullMqWorkerNames.executeTrade
);

// create Worker
createWorker(
    bullMqWorkerNames.executeTrade,
    async (job: Job) => await executeTradeV2Processor({ job })
)

// ---------- INITIALIZE ---------- //
export async function initializeExecuteTradesV2() {
    const pendingTrades = await prisma.membertrades.findMany({
        where: {
            tradePNL: 0
        },
        orderBy: {
            timeExecuted: "asc"
        }
    })

    pendingTrades.forEach(async (trade) => {
        await executeTradesV2QueueUpsertJobScheduler(trade)
    })
}

export async function executeTradesV2QueueUpsertJobScheduler(trade: membertrades) {

    return await executeTradesV2Queue.upsertJobScheduler(
        `executeTradeV2:${trade.id}`,
        {
            pattern: "*/1 * * * *", // every 1 minute
        },
        {
            data: {
                tradeId: trade.id
            },
            name: `executeTradeV2:${trade.id}`,
        }
    )
}

async function executeTradeV2Processor({ job }: { job: Job }) {
    const { tradeId } = job.data;

    const trade = await prisma.membertrades.findFirst({
        where: {
            id: tradeId,
            tradePNL: 0
        }
    })
    if (!trade) {
        await executeTradesV2Queue.removeJobScheduler(`executeTradeV2:${tradeId}`)
        return job.log(`Trade with id ${tradeId} not found or already executed. Removed job scheduler.`)
    }

    const gameSettings = await prisma.sitesettings.findFirst();
    if (!gameSettings) {
        return job.log("Game settings not found. Skipping...");
    }

    const returnOnWin = gameSettings.returnOnWin - 1;

    const { timeExecuted, type, tradeAmount, trade: memberTrade, membersId } = trade;

    const processedTimeExecuted = new Date(timeExecuted);
    processedTimeExecuted.setSeconds(0);

    const tradeReference = await prisma.recenttrades.findFirst({
        where: {
            type,
            tradinghours: {
                gte: processedTimeExecuted
            }
        },
        orderBy: {
            tradinghours: "asc"
        }
    });
    if (!tradeReference) {
        return job.log(`No trade reference found for trade id ${tradeId}. Skipping...`);
    }

    const { id, result, tradinghours, type: tradeReferenceType } = tradeReference
    const now = new Date();
    if (now < tradinghours) {
        return job.log("Trade time is greater than member trade time. Skipping...");
    } else {
        const isWon = memberTrade === result;
        const tradePNL = isWon
            ? (tradeAmount * 2) * returnOnWin
            : -tradeAmount;

        await prisma.membertrades.update({
            where: {
                id: trade.id
            },
            data: {
                tradePNL
            }
        })

        if (isWon) {
            const member = await prisma.members.findFirst({
                where: {
                    id: membersId
                }
            })
            if (!member) {
                return job.log(`Member with id ${membersId} not found. Skipping balance update...`);
            }

            await prisma.members.update({
                where: {
                    id: member.id
                },
                data: {
                    balance: {
                        increment: tradePNL
                    }
                }
            })

            await executeTradesV2Queue.removeJobScheduler(`executeTradeV2:${tradeId}`)
            return job.log(`Trade with id ${tradeId} won. Updated balance for member id ${member.id}.`);
        }

        await executeTradesV2Queue.removeJobScheduler(`executeTradeV2:${tradeId}`)
        return job.log(`Trade with id ${tradeId} lost. No balance update needed.`);
    }
}
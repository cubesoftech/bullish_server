import { membertrades } from "@prisma/client";
import prisma from "../helpers/prisma";
import { scheduleJob } from "node-schedule"

export default function initializeExecuteTradeJob() {
    try {
        const job = scheduleJob("0 * * * * *", async () => {
            executeTrades();
        })

        job.invoke();
    } catch (error) {
        console.log("Error initializing execute trade job:", error);
    }
}

const executeTrades = async () => {
    const now = new Date();

    const pendingTrades = await prisma.membertrades.findMany({
        where: {
            tradePNL: 0,
        }
    })

    const gameSettings = await prisma.sitesettings.findFirst();

    const returnOnWin = (gameSettings?.returnOnWin || 1.95) - 1;

    pendingTrades.forEach(async (trade: membertrades) => {
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

        if (tradeReference) {
            const { id, result, tradinghours, type } = tradeReference;
            if (now < tradinghours) {
                console.log("Trade time is greater than member trade time. Skipping...");
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
                });

                if (isWon) {
                    await prisma.members.update({
                        where: {
                            id: membersId
                        },
                        data: {
                            balance: {
                                increment: tradePNL
                            }
                        }
                    })
                }
            }
        }
    })
}
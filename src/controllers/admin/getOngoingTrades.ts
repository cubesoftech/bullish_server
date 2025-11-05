import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import _, { result } from "lodash"
import { recenttrades_type } from "@prisma/client";

export default async function getOngoingTrades(req: Request, res: Response, next: NextFunction) {
    try {
        const pendingTrades = await prisma.membertrades.findMany({
            where: {
                tradePNL: 0
            },
            orderBy: {
                type: "asc"
            },
        })

        const grouped = _.groupBy(pendingTrades, 'type');

        //grouped again the data by the trade type { totallong, totalshort, totalAmountLong, totalAmountShort }
        const newGrouped: any = {};

        const results = await Promise.all(
            Object.keys(grouped)
                .map(async (key: string | recenttrades_type) => {
                    const result = await prisma.recenttrades.findFirst({
                        where: {
                            tradinghours: {
                                gte: new Date()
                            },
                            type: key as recenttrades_type
                        },
                        orderBy: {
                            tradinghours: "asc"
                        }
                    })

                    let totalLong = 0;
                    let totalShort = 0;
                    let totalAmountLong = 0;
                    let totalAmountShort = 0;

                    grouped[key].map((trade) => {
                        if (trade.trade) {
                            totalLong++;
                            totalAmountLong += trade.tradeAmount;
                        } else {
                            totalShort++;
                            totalAmountShort += trade.tradeAmount;
                        }
                    })

                    return {
                        key,
                        result: Boolean(result?.result),
                        tradeID: result?.id,
                        totalLong,
                        totalShort,
                        totalAmountLong,
                        totalAmountShort,
                    }
                })
        )

        results.forEach(({ key, totalLong, totalShort, totalAmountLong, totalAmountShort, result, tradeID }) => {
            newGrouped[key] = {
                totalLong,
                totalShort,
                totalAmountLong,
                totalAmountShort,
                result,
                tradeID
            }
        })

        return res.status(200).json({ data: newGrouped })
    } catch (error) {
        console.log("Error admin | getMasterAgents: ", error)
        return next()
    }
}
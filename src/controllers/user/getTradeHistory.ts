import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";
import { startOfDay, subDays, subMonths, subYears } from "date-fns";

export default async function getTradeHistory(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { limit, page, time, from, to } = req.query;

    const acceptedTimeframes = ["today", "yesterday", "week", "month", "year", "all"]

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    const processedTime = acceptedTimeframes.includes(time as string) ? time as string : "all"

    let where: Prisma.membertradesWhereInput = {
        membersId: user.id
    }
    const now = new Date()

    switch (processedTime) {
        case "today": {
            where = {
                membersId: user.id,
                timeExecuted: {
                    gte: startOfDay(now)
                }
            };
            break;
        };
        case "yesterday": {
            where = {
                membersId: user.id,
                timeExecuted: {
                    gte: startOfDay(subDays(now, 1))
                }
            };
            break;
        };
        case " week": {
            where = {
                membersId: user.id,
                timeExecuted: {
                    gte: startOfDay(subDays(now, 7))
                }
            };
            break;
        };
        case "month": {
            where = {
                membersId: user.id,
                timeExecuted: {
                    gte: startOfDay(subMonths(now, 1))
                }
            };
            break;
        };
        case "year": {
            where = {
                membersId: user.id,
                timeExecuted: {
                    gte: startOfDay(subYears(now, 1))
                }
            };
            break;
        };
        default: {
            where = {
                membersId: user.id,
            };
            break;
        }
    }
    if (from && to) {
        const processedFrom = new Date(from as string).toISOString()
        const processedTo = new Date(to as string).toISOString()

        if (processedFrom > processedTo) {
            return next({
                status: 400,
                message: "'From' date cannot be later than 'To' date."
            })
        }
        where = {
            membersId: user.id,
            timeExecuted: {
                gte: new Date(processedFrom),
                lte: new Date(processedTo),
            }
        }
    }

    try {

        const tradeHistory = await prisma.membertrades.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                timeExecuted: 'desc'
            },
        })
        const totalTrades = await prisma.membertrades.count({ where })

        const processedTradeHistory = tradeHistory.map(trade => ({
            ...trade,
            tradinghours: `${trade.timeExecuted.toLocaleDateString()} ${trade.timeExecuted.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        }))

        return res.status(200).json({
            total: totalTrades,
            data: processedTradeHistory
        })
    } catch (error) {
        console.log("Error user | getTradeHistory:", error);
        return next()
    }
}
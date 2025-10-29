import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { membertrades_type } from "@prisma/client";
import { setSeconds } from "date-fns";
import { getUserData } from "../../helpers";

export default async function getTradeData(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { type } = req.query;

    const processedType = type as membertrades_type || "nasdaq_1_min"

    try {
        const [recentTrades, recentMemberTrades] = await Promise.all([
            getRecentTradeData(processedType),
            getRecentMemberTrades(processedType, user.id)
        ])

        return res.status(200).json({
            data: {
                recentTrades,
                recentMemberTrades
            }
        })
    } catch (error) {
        console.log("Error user | getTradeData:", error);
        return next()
    }

}

const getRecentTradeData = async (type: membertrades_type) => {
    const now = setSeconds(new Date(), 0);

    const recentTradeData = await prisma.recenttrades.findMany({
        where: {
            type,
            tradinghours: {
                lte: now
            }
        },
        orderBy: {
            tradinghours: "desc"
        },
        take: 50
    })

    const processedRecentTradeData = recentTradeData.map(trade => ({
        ...trade,
        tradinghours: `${trade.tradinghours.toLocaleDateString()} ${trade.tradinghours.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
        )}`,
        tradingHoursUntouched: trade.tradinghours,
    }))

    return {
        data: processedRecentTradeData,
        type,
        now: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    }
}
const getRecentMemberTrades = async (type: membertrades_type, userId: string) => {
    const member = await getUserData({
        userId,
        select: {
            id: true
        }
    })
    if (!member) {
        return null;
    }

    const now = setSeconds(new Date(), 0);

    const pendingTrades = await prisma.membertrades.findMany({
        where: {
            membersId: member.id,
            tradePNL: 0,
        }
    })
    const recentMemberTrade = await prisma.membertrades.findMany({
        where: {
            membersId: member.id,
            timeExecuted: {
                lte: now
            }
        },
        orderBy: {
            timeExecuted: "desc"
        },
        take: 50
    })

    const foundPendingTrades = pendingTrades.filter(trade => {
        return !recentMemberTrade.find(recentTrade => recentTrade.id === trade.id)
    })

    const allTrades = [...foundPendingTrades, ...recentMemberTrade];

    const processedRecentMemberTrade = allTrades.map(trade => ({
        ...trade,
        tradinghours: `${trade.timeExecuted.toLocaleDateString()} ${trade.timeExecuted.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
        )}`,
        tradingHoursUntouched: trade.timeExecuted,
    }))

    return {
        data: processedRecentMemberTrade,
        type,
        now: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    }
}
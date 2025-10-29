import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";

export default async function getUserStats(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    try {
        const [totalDeposit, totalPNL] = await Promise.all([
            getTotalDeposit(user.id),
            getTotalPNL(user.id)
        ])

        const totalPNLPercent = totalDeposit <= 0
            ? 0
            : (totalPNL / totalDeposit) * 100

        return res.status(200).json({
            data: {
                totalDeposit,
                pnl: totalPNL,
                pnlPercent: totalPNLPercent
            }
        })
    } catch (error) {
        console.log("Error user | getUserStats:", error);
        return next()
    }
}

const getTotalDeposit = async (userId: string) => {
    const deposits = await prisma.transaction.aggregate({
        where: {
            membersId: userId,
            type: "deposit",
            status: "completed"
        },
        _sum: {
            amount: true
        }
    })

    return deposits._sum.amount || 0
}
const getTotalPNL = async (userId: string) => {
    const trades = await prisma.membertrades.findMany({
        where: {
            membersId: userId
        }
    })

    const total_pnl = trades.reduce((sum, trade) => {
        const tradePNL = trade.tradePNL || 0; // Default to 0 if tradePNL is null
        const tradeAmount = trade.tradeAmount || 0; // Default to 0 if tradeAmount is null
        const pnl = tradePNL > 0 ? tradePNL - tradeAmount : tradePNL; // Adjust PNL based on the condition
        return sum + pnl; // Accumulate the PNL
    }, 0);

    return total_pnl
}
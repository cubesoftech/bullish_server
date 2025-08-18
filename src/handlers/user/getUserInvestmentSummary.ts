import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function getUserInvestmentSummary(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." });
        }

        const investments = await prisma.investment_log.aggregate({
            where: {
                userId: user.id,
            },
            _sum: {
                amount: true,
                totalProfit: true,
            }
        })

        const averageSettlementRate = await prisma.profit_log.aggregate({
            where: {
                userId: user.id,
            },
            _avg: {
                settlementRate: true,
            }
        })

        return res.status(200).json({
            data: {
                totalInvestment: investments._sum.amount,
                totalProfit: investments._sum.totalProfit,
                averageSettlementRate: (averageSettlementRate._avg.settlementRate || 0) * 100, //convert from decimal to percent
            }
        });
    } catch (error) {
        console.log("Error on getUserInvestmentSummary: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
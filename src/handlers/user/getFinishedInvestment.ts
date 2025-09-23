import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getEndedInvestment(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1


    const lastPeriods = [3, 12, 12, 24, 36]
    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const where: Prisma.investment_logWhereInput = {
            userId: user.id,
            status: "COMPLETED",
        }

        const endedInvestments = await prisma.investment_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                series: true,
                investment_amount_withdrawal_log: true,
            }
        });
        const totalEndedInvestments = await prisma.investment_log.count({ where })

        const processedEndedInvestments = endedInvestments.map(investment => ({
            ...investment,
            settlementRate: investment.settlementRate * 100,
            peakSettlementRate: investment.peakSettlementRate * 100,
            leanSettlementRate: investment.leanSettlementRate * 100,
            coveredAllPeriods: lastPeriods[Number(investment.series.seriesId) - 1] === investment.investmentDuration,
            lastDuration: lastPeriods[Number(investment.seriesId) - 1],
            investmentAmountWithdrawned: investment.investment_amount_withdrawal_log.filter(investment => investment.status === "COMPLETED").length > 0,
        }))

        return res.status(200).json({ data: processedEndedInvestments, total: totalEndedInvestments })
    } catch (error) {
        console.log("Error on getEndedInvestments: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
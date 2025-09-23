import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";
import { addMonths, differenceInDays, differenceInMonths } from "date-fns";

export default async function getOngoingInvestment(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    const now = new Date()

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const where: Prisma.investment_logWhereInput = {
            userId: user.id,
            status: "PENDING"
        }

        const ongoingInvestments = await prisma.investment_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                series: {
                    include: {
                        peakSeason: true,
                        periods: true,
                        rate: true,
                    }
                }
            }
        });
        const totalOngoingInvestments = await prisma.investment_log.count({ where })

        const processedOngoingInvestments = ongoingInvestments.map(investment => {
            const currentMonth = now.getMonth() + 1; // Months are zero-based

            const peakSeasonStartMonth = investment.series.peakSeason?.peakSeasonStartMonth
            const peakSeasonEndMonth = investment.series.peakSeason?.peakSeasonEndMonth

            const isOnPeak = currentMonth >= peakSeasonStartMonth! && currentMonth <= peakSeasonEndMonth!

            // ---------- LOGIC FOR WITHDRAWAL FEE ---------- //
            const maturityDate = addMonths(
                investment.createdAt,
                investment.investmentDuration
            )

            const months = differenceInMonths(
                maturityDate,
                investment.createdAt
            )
            const days = differenceInDays(
                maturityDate,
                addMonths(investment.createdAt, months)
            )

            const processedMonths = days >= 15 ? months + 1 : months;
            const monthsCovered = investment.investmentDuration - processedMonths;

            const remainingPeriodFactor = processedMonths / investment.investmentDuration;
            const withdrawalFee = investment.amount * (18 / 100) * remainingPeriodFactor;
            const refundableAmount = investment.amount - withdrawalFee

            return {
                ...investment,
                isOnPeak,
                peakSettlementRate: investment.peakSettlementRate * 100,
                leanSettlementRate: investment.leanSettlementRate * 100,
                withdrawalFee,
                refundableAmount,
            }
        })

        return res.status(200).json({ data: processedOngoingInvestments, total: totalOngoingInvestments })
    } catch (error) {
        console.log("Error on getOngoingInvestment: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
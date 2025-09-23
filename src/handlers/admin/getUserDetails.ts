import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { getInvestmentAdditionalData } from "../../utils";
import { series_periods } from "@prisma/client";


export default async function getUserDetails(req: Request, res: Response) {
    const { id } = req.query;

    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "사용자 ID는 필수입니다." });
    }

    try {
        const user = await prisma.users.findFirst({
            where: {
                id: id
            },
            include: {
                referrer: true,
                referredUsers: true,
                referrerAgent: true,
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const totalInvestmentAmount = await prisma.investment_log.aggregate({
            where: {
                userId: user.id,
            },
            _sum: {
                amount: true,
            }
        })

        const { settlementRate } = getInvestmentAdditionalData({
            // amount is the user's total investment
            userTotalInvestmentAmount: totalInvestmentAmount._sum.amount || 0,
            amount: 0,
            createdAt: new Date(),
            series: {
                periods: [
                    { id: "", createdAt: new Date, period: 1, seriesId: "", updatedAt: new Date() }
                ] as series_periods[],
                rate: null
            }
        })

        const processedUser = {
            ...user,
            totalInvestmentAmount: totalInvestmentAmount._sum.amount || 0,
            referrerPoints: Number(user.referrerPoints),
            isReferreredByAgent: user.referrerAgentId !== null,
            baseSettlementRate: user.baseSettlementRate * 100, //convert from decimal to percent
            settlementRate: settlementRate * 100, //convert from decimal to percent
            referrer: {
                ...user.referrer,
                referrerPoints: Number(user.referrer?.referrerPoints),
            },
            referredUsers: user.referredUsers.map(referredUser => ({
                ...referredUser,
                referrerPoints: Number(referredUser.referrerPoints),
            }))
        }

        return res.status(200).json({ data: processedUser });
    } catch (error) {
        console.error("Error fetching user details: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
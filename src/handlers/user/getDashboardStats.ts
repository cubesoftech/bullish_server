import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function getDashboardStats(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." })
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const totalParticipationAmount = await prisma.investment_log.aggregate({
            where: {
                userId: userInfo.id,
            },
            _sum: {
                amount: true
            }
        })
        const profitLogs = await prisma.profit_log.aggregate({
            where: {
                userId: userInfo.id,
            },
            _sum: {
                profit: true
            },
            _avg: {
                settlementRate: true
            }
        })

        const monthlySettlementRate = await prisma.monthly_referrer_profit_log.findMany({
            where: {
                userId: user.id,
                type: "REFERRER1"
            },
            orderBy: {
                createdAt: "asc"
            },
            take: 6
        })
        const processedMonthltySettlementRate = monthlySettlementRate.map(item => ({
            ...item,
            amount: item.type === "REFERRER1" ? item.amount * 100 : item.amount,
        }))

        const startMonth = new Date(
            new Date().setMonth(
                new Date().getMonth() - 6
            )
        );
        startMonth.setDate(1); // Set to the first day of the month

        const cumulativeProfit = await Promise.all(
            [1, 2, 3, 4, 5, 6].map(async (month) => {
                const targetMonth = new Date(
                    startMonth.getFullYear(),
                    startMonth.getMonth() + month,
                    startMonth.getDate()
                );
                const beginningOfThisMonth = new Date(
                    targetMonth.getFullYear(),
                    targetMonth.getMonth() - 1,
                    1
                )
                const data = await prisma.profit_log.aggregate({
                    where: {
                        userId: user.id,
                        createdAt: {
                            gte: startMonth,
                            lt: targetMonth
                        }
                    },
                    _count: {
                        _all: true
                    },
                    _sum: {
                        profit: true
                    }
                })
                const monthlyProfit = await prisma.profit_log.aggregate({
                    where: {
                        userId: user.id,
                        createdAt: {
                            gt: beginningOfThisMonth,
                            lte: targetMonth
                        }
                    },
                    _sum: {
                        profit: true
                    }
                })
                return {
                    month: targetMonth,
                    count: data._count._all,
                    profit: monthlyProfit._sum.profit ?? 0,
                    total: data._sum.profit ?? 0
                }
            })
        )

        const series = await prisma.series.findMany({
            orderBy: {
                seriesId: "asc"
            }
        })

        const totalInvestmentEachSeries = await Promise.all(
            series.map(async (s) => {
                const count = await prisma.investment_log.count({
                    where: {
                        userId: user.id,
                        seriesId: s.id
                    }
                })

                return {
                    name: s.name,
                    count
                }
            })

        )

        const summary = {
            totalParticipationAmount: totalParticipationAmount._sum.amount ?? 0,
            totalProfit: profitLogs._sum.profit ?? 0,
            averageSettlementRate: (profitLogs._avg.settlementRate ?? 0) * 100, //convert from decimal to percent
        }
        const data = {
            summary,
            monthlySettlementRate: processedMonthltySettlementRate,
            cumulativeProfit,
            totalInvestmentEachSeries
        }

        return res.status(200).json({ data })
    } catch (error) {
        console.log("Error on getDashboardStats: ", error)
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
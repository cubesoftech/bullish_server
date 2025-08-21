import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getDashboardStats(req: Request, res: Response) {
    try {
        const totalUsers = await prisma.users.count();
        const totalDepositAmount = await prisma.deposit_log.aggregate({
            where: {
                status: "COMPLETED",
            },
            _sum: {
                amount: true,
            },
        })
        const totalWithdrawalAmount = await prisma.withdrawal_log.aggregate({
            where: {
                status: "COMPLETED",
            },
            _sum: {
                amount: true,
            },
        });
        const signedUpToday = await prisma.users.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
        });
        const totalDepositRequests = await prisma.deposit_log.count()
        const totalWithdrawalRequests = await prisma.withdrawal_log.count();
        const totalPendingUsers = await prisma.users.count({
            where: {
                status: false,
            },
        });
        const newInquiries = await prisma.inquiry_log.count({
            where: {
                isReplied: false,
            }
        })
        const recentNotices = await prisma.notices.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        });
        const recentActivityLogs = await prisma.activity_log.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    omit: {
                        referrerPoints: true,
                    }
                },
            },
            take: 5,
        });

        const series = await prisma.series.findMany({
            orderBy: {
                seriesId: "asc"
            }
        })
        const settlementProfits = await Promise.all(
            series.map(async (s) => {
                const totalSettlementProfit = await prisma.profit_log.aggregate({
                    where: {
                        seriesId: s.id
                    },
                    _sum: {
                        profit: true
                    }
                })
                return {
                    id: s.id,
                    seriesId: s.seriesId,
                    name: s.name,
                    totalSettlementProfit: totalSettlementProfit._sum.profit || 0,
                }
            })
        )

        const now = new Date()
        const expiringInvestments = await prisma.investment_log.findMany({
            where: {
                status: "PENDING",
                maturityDate: {
                    lte: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
                }
            },
            orderBy: {
                maturityDate: "desc"
            },
            include: {
                user: {
                    omit: {
                        referrerPoints: true
                    }
                },
                series: {
                    include: {
                        periods: true,
                        rate: true,
                        peakSeason: true,
                    }
                }
            }
        })

        return res.status(200).json({
            data: {
                totalUsers,
                totalDepositAmount: totalDepositAmount._sum.amount || 0,
                totalWithdrawalAmount: totalWithdrawalAmount._sum.amount || 0,
                signedUpToday,
                settlementProfits,
                totalDepositRequests,
                totalWithdrawalRequests,
                expiringInvestments,
                totalPendingUsers,
                newInquiries,
                recentNotices,
                recentActivityLogs,
            }
        })

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
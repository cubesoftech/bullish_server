import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getDashboardStats(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    const startOfThisMonth = new Date(new Date().setDate(1));
    const endOfThisMonth = new Date(new Date().setMonth(new Date().getMonth() + 1, 0));
    try {
        const totalUsers = await prisma.users.count();
        const signedUpToday = await prisma.users.count({
            where: {
                createdAt: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
            },
        });
        // daily basis
        const depositToday = await prisma.deposit_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
                status: "COMPLETED"
            },
            _sum: {
                amount: true,
            }
        })
        const withdrawalToday = await prisma.withdrawal_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
                status: "COMPLETED"
            },
            _sum: {
                amount: true,
            }
        })
        const settlementProfitToday = await prisma.profit_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfToday,
                    lt: endOfToday,
                },
            },
            _sum: {
                profit: true,
            }
        })
        // monthly basis
        const depositThisMonth = await prisma.deposit_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfThisMonth,
                    lt: endOfThisMonth,
                },
                status: "COMPLETED"
            },
            _sum: {
                amount: true,
            }
        })
        const withdrawalThisMonth = await prisma.withdrawal_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfThisMonth,
                    lt: endOfThisMonth,
                },
                status: "COMPLETED"
            },
            _sum: {
                amount: true,
            }
        })
        const settlementProfitThisMonth = await prisma.profit_log.aggregate({
            where: {
                createdAt: {
                    gte: startOfThisMonth,
                    lt: endOfThisMonth,
                },
            },
            _sum: {
                profit: true,
            }
        })
        // all time total
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
        const totalSettlementProfit = await prisma.profit_log.aggregate({
            _sum: {
                profit: true,
            },
        })
        const totalDepositRequests = await prisma.deposit_log.count()
        const totalWithdrawalRequests = await prisma.withdrawal_log.count();
        const totalPendingUsers = await prisma.users.count({
            where: {
                status: false,
            },
        });
        const recentReviews = await prisma.review_log.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    omit: {
                        referrerPoints: true,
                    }
                }
            },
            take: 5,
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

        const admin = await prisma.admin.findUnique({
            where: {
                id: user.id
            },
            select: {
                note: true,
                summary: true,
            }
        })

        return res.status(200).json({
            data: {
                totalUsers,
                signedUpToday,
                settlementProfits,
                totalDepositRequests,
                totalWithdrawalRequests,
                expiringInvestments,
                totalPendingUsers,
                newInquiries,
                recentNotices,
                recentActivityLogs,
                recentReviews,
                summary: admin?.summary || "",
                note: admin?.note || "",
                // daily
                depositToday: depositToday._sum.amount || 0,
                withdrawalToday: withdrawalToday._sum.amount || 0,
                settlementProfitToday: settlementProfitToday._sum.profit || 0,
                // monthly
                depositThisMonth: depositThisMonth._sum.amount || 0,
                withdrawalThisMonth: withdrawalThisMonth._sum.amount || 0,
                settlementProfitThisMonth: settlementProfitThisMonth._sum.profit || 0,
                // total 
                totalDepositAmount: totalDepositAmount._sum.amount || 0,
                totalWithdrawalAmount: totalWithdrawalAmount._sum.amount || 0,
                totalSettlementProfit: totalSettlementProfit._sum.profit || 0,
            }
        })

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
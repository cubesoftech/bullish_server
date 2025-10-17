import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { addDays, endOfDay, endOfMonth, isBefore, startOfDay, startOfMonth, subDays } from "date-fns";

interface UserPageAnalytics {
    date: Date;
    pageViews: number;
    uniqueVisitors: number;
    topPages: {
        path: string;
        views: number;
    }[];
}

const now = new Date()

const eightDaysAgo = subDays(now, 8);
const sevenDaysAgo = subDays(now, 7);

const startOfToday = startOfDay(now);
const endOfToday = endOfDay(now);

const startOfThisMonth = startOfMonth(now);
const endOfThisMonth = endOfMonth(now);



export default async function getDashboardStats(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    try {
        // ---------- UNUSED DATA ---------- //
        // const { depositToday, withdrawalToday, settlementProfitToday } = await getTransactionsToday();
        // const { depositThisMonth, withdrawalThisMonth, settlementProfitThisMonth } = await getTransactionsThisMonth();
        // const { totalDepositRequests, totalWithdrawalRequests } = await getTransactionsRequests();


        // ---------- USED DATA ---------- //
        const { totalUsers, signedUpToday, totalPendingUsers } = await getUsers();
        const { totalSettlementProfit } = await getTransactionsTotal();
        const { recentReviews, newInquiries, recentNotices, recentActivityLogs } = await getRecentDatas();
        const { settlementProfits } = await getSettlementProfits();
        const { expiringInvestments } = await getExpiringInvestments();
        const { processedExtendInvestmentRequests } = await getExtendedInvestmentRequests();
        const { processedEarlyWithdrawal } = await getEarlyWithdrawal();
        const { admin } = await getAdmin(user.id);
        const { totalPendingInvestments, totalCompletedInvestments } = await getTotalInvestment();
        const { totalInvestmentToday, totalInvestmentThisMonth, totalInvestmentAmount } = await getTotalInvestmentByPeriod();
        const { withdrawnedPrincipalAmount } = await getWithdrawnedPrincipalAmount();
        const { totalDistributedProfit } = await getTotalDistributedProfit();
        const { totalPrincipalAmount } = await getTotalPrincipalAmount();
        const { userPageAnalytics } = await getUserPageAnalytics();

        const data = {
            totalPendingInvestments,
            totalCompletedInvestments,
            totalUsers,
            signedUpToday,
            settlementProfits,
            totalDepositRequests: 0,
            totalWithdrawalRequests: 0,
            expiringInvestments,
            totalPendingUsers,
            newInquiries,
            recentNotices,
            recentActivityLogs,
            recentReviews,
            summary: admin?.summary || "",
            note: admin?.note || "",
            // daily
            depositToday: 0,
            withdrawalToday: 0,
            settlementProfitToday: 0,
            // monthly
            depositThisMonth: 0,
            withdrawalThisMonth: 0,
            settlementProfitThisMonth: 0,
            // total 
            totalDepositAmount: 0,
            totalWithdrawalAmount: 0,
            totalSettlementProfit: totalSettlementProfit._sum.profit || 0,

            extendInvestmentRequests: processedExtendInvestmentRequests,
            earlyWithdrawalRequests: processedEarlyWithdrawal,

            totalInvestmentToday: totalInvestmentToday._sum.amount || 0,
            totalInvestmentThisMonth: totalInvestmentThisMonth._sum.amount || 0,
            totalInvestmentAmount: totalInvestmentAmount._sum.amount || 0,

            totalWithdrawnedPrincipalAmount: withdrawnedPrincipalAmount._sum.amount || 0,
            totalWithdrawnedSettlementAndPrincipalAmount: (totalDistributedProfit._sum.profit || 0) + (totalPrincipalAmount._sum.amount || 0),

            userPageAnalytics
        }


        return res.status(200).json({ data })

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}

const getUsers = async () => {
    const totalUsers = await prisma.users.count();
    const signedUpToday = await prisma.users.count({
        where: {
            createdAt: {
                gte: startOfToday,
                lt: endOfToday,
            },
        },
    });
    const totalPendingUsers = await prisma.users.count({
        where: {
            status: false,
        },
    });

    return { totalUsers, signedUpToday, totalPendingUsers };
}
const getTransactionsToday = async () => {
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

    return { depositToday, withdrawalToday, settlementProfitToday }
}
const getTransactionsThisMonth = async () => {
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

    return { depositThisMonth, withdrawalThisMonth, settlementProfitThisMonth }
}
const getTransactionsTotal = async () => {
    // ---------- UNUSED DATA ---------- //
    // const totalDepositAmount = await prisma.deposit_log.aggregate({
    //     where: {
    //         status: "COMPLETED",
    //     },
    //     _sum: {
    //         amount: true,
    //     },
    // })
    // const totalWithdrawalAmount = await prisma.withdrawal_log.aggregate({
    //     where: {
    //         status: "COMPLETED",
    //     },
    //     _sum: {
    //         amount: true,
    //     },
    // });
    // ---------- USED DATA ---------- //
    const totalSettlementProfit = await prisma.profit_log.aggregate({
        _sum: {
            profit: true,
        },
    })

    return { totalSettlementProfit }
}
const getTransactionsRequests = async () => {
    const totalDepositRequests = await prisma.deposit_log.count()
    const totalWithdrawalRequests = await prisma.withdrawal_log.count();

    return { totalDepositRequests, totalWithdrawalRequests }
}
const getRecentDatas = async () => {
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

    return { recentReviews, newInquiries, recentNotices, recentActivityLogs }
}
const getSettlementProfits = async () => {
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

    return { settlementProfits }
}
const getExpiringInvestments = async () => {
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

    return { expiringInvestments }
}
const getExtendedInvestmentRequests = async () => {
    const extendInvestmentRequests = await prisma.extend_investment_duration_log.findMany({
        where: {
            status: "PENDING"
        },
        take: 5,
        orderBy: {
            createdAt: "desc"
        },
        include: {
            user: true,
            investmentLog: {
                include: {
                    series: true,
                }
            }
        }
    })
    const processedExtendInvestmentRequests = extendInvestmentRequests.map(req => ({
        ...req,
        user: {
            ...req.user,
            referrerPoints: Number(req.user.referrerPoints),
        }
    }))

    return { processedExtendInvestmentRequests }
}
const getEarlyWithdrawal = async () => {
    const earlyWithdrawal = await prisma.investment_early_withdrawal_log.findMany({
        where: {
            status: "PENDING"
        },
        take: 5,
        orderBy: {
            createdAt: "desc"
        },
        include: {
            user: true,
            investmentLog: {
                include: {
                    series: true,
                }
            }
        }
    })
    const processedEarlyWithdrawal = earlyWithdrawal.map(req => ({
        ...req,
        user: {
            ...req.user,
            referrerPoints: Number(req.user.referrerPoints),
        }
    }))

    return { processedEarlyWithdrawal }
}
const getAdmin = async (adminId: string) => {
    const admin = await prisma.admin.findUnique({
        where: {
            id: adminId
        },
        select: {
            note: true,
            summary: true,
        }
    })

    return { admin }
}
const getTotalInvestment = async () => {
    const totalPendingInvestments = await prisma.investment_log.count({
        where: {
            status: "PENDING"
        }
    })
    const totalCompletedInvestments = await prisma.investment_log.count({
        where: {
            status: "COMPLETED"
        }
    })

    return { totalPendingInvestments, totalCompletedInvestments }
}
const getTotalInvestmentByPeriod = async () => {
    const totalInvestmentToday = await prisma.investment_log.aggregate({
        where: {
            status: {
                not: "FAILED"
            },
            createdAt: {
                gte: startOfDay(new Date()),
                lt: endOfDay(new Date())
            }
        },
        _sum: {
            amount: true,
        }
    })
    const totalInvestmentThisMonth = await prisma.investment_log.aggregate({
        where: {
            status: {
                not: "FAILED"
            },
            createdAt: {
                gte: startOfMonth(new Date()),
                lt: endOfMonth(new Date())
            }
        },
        _sum: {
            amount: true,
        }
    })
    const totalInvestmentAmount = await prisma.investment_log.aggregate({
        where: {
            status: {
                not: "FAILED"
            },
        },
        _sum: {
            amount: true
        }
    })

    return { totalInvestmentToday, totalInvestmentThisMonth, totalInvestmentAmount }
}
const getWithdrawnedPrincipalAmount = async () => {
    const withdrawnedPrincipalAmount = await prisma.investment_amount_withdrawal_log.aggregate({
        where: {
            status: "COMPLETED"
        },
        _sum: {
            amount: true,
        }
    })

    return { withdrawnedPrincipalAmount }
}
const getTotalDistributedProfit = async () => {
    const totalDistributedProfit = await prisma.profit_log.aggregate({
        _sum: {
            profit: true,
        }
    })

    return { totalDistributedProfit }
}
const getTotalPrincipalAmount = async () => {
    const totalPrincipalAmount = await prisma.investment_log.aggregate({
        _sum: {
            amount: true,
        }
    })
    return { totalPrincipalAmount }
}
const getUserPageAnalytics = async () => {
    const firstAnalyticsLog = await prisma.analytics.findMany({
        orderBy: {
            createdAt: "asc"
        },
        take: 1
    })

    let userPageAnalytics: UserPageAnalytics[] = [];

    if (!firstAnalyticsLog || firstAnalyticsLog.length === 0) {
        userPageAnalytics = []
    }

    const firstAnalyticsLogCreatedAt = firstAnalyticsLog[0].createdAt
    const startDate = isBefore(firstAnalyticsLogCreatedAt, sevenDaysAgo) ? sevenDaysAgo : firstAnalyticsLogCreatedAt;

    // i don't know why but this for loop works only until yesterday when i use date <= now so i added one more day to make it work until today
    for (let date = startDate; date <= addDays(now, 1); date = addDays(date, 1)) {
        const [pageViewsToday, uniqueVisitorsToday, topPagesToday] = await Promise.all([
            prisma.analytics.count({
                where: {
                    createdAt: {
                        gte: startOfDay(date),
                        lt: endOfDay(date)
                    }
                }
            }),
            prisma.analytics.groupBy({
                by: ["ipAddress"],
                where: {
                    createdAt: {
                        gte: startOfDay(date),
                        lt: endOfDay(date)
                    }
                },
                _count: true,
            }),
            prisma.analytics.groupBy({
                by: ["path"],
                where: {
                    createdAt: {
                        gte: startOfDay(date),
                        lt: endOfDay(date)
                    }
                },
                _count: {
                    path: true,
                },
                orderBy: {
                    _count: {
                        path: "desc"
                    }
                },
                take: 5
            })
        ])
        userPageAnalytics.push({
            date,
            pageViews: pageViewsToday,
            uniqueVisitors: uniqueVisitorsToday.length,
            topPages: topPagesToday.map(page => ({
                path: page.path,
                views: page._count.path
            }))
        })
    }

    return { userPageAnalytics }
}
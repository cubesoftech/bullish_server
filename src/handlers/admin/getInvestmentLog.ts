import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma, transaction_status } from "@prisma/client";
import { addDays, endOfDay, startOfDay, subDays, subMonths } from "date-fns";

export default async function getInvestmentLog(req: Request, res: Response) {
    const { page, limit, search, sortAmount, sortCreatedBy, type_, searchType } = req.query;

    const acceptedCreatedBySort = ['asc', 'desc'];
    const acceptedTotalInvestmentSort = ['asc', 'desc'];
    const acceptedSearchTypes = ['details', 'logs'];

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 25;
    const processedType = (type_ as string) || "default";
    const processedCreatedBySort =
        sortCreatedBy && acceptedCreatedBySort.includes(sortCreatedBy as string)
            ? (sortCreatedBy as string)
            : "desc";
    const processedSearchType = searchType && acceptedSearchTypes.includes(searchType as string) ? searchType as string : "logs"


    const acceptedTypes = ["default", "1", "2", "3", "4", "5", "today", "week"]
    if (!acceptedTypes.includes(type_ as string)) {
        return res.status(400).json({ message: "Invalid type filter" });
    }
    const now = new Date();

    let orderBy: Prisma.investment_logOrderByWithRelationInput = {
        createdAt: processedCreatedBySort as "asc" | "desc",
    }

    if (sortAmount && acceptedTotalInvestmentSort.includes(sortAmount as string)) {
        orderBy = {
            amount: sortAmount as "asc" | "desc",
        }
    }

    try {
        let where: Prisma.investment_logWhereInput = {}

        const investment = await prisma.investment_log.findMany({
            where: {
                status: "PENDING"
            },
            orderBy: {
                createdAt: "asc"
            },
            select: {
                createdAt: true
            },
            take: 1
        })
        const oldestPendingInvestmentDate = new Date(investment[0].createdAt)

        const weekly: Date[] = []
        const monthly: Date[] = []
        const quarterly: Date[] = []

        const sevenDaysAgo = subDays(now, 7)

        if (search) {
            if (processedSearchType === "details") {
                where = {
                    ...where,
                    user: {
                        name: search as string,
                    }
                }
            } else {
                where = {
                    ...where,
                    user: {
                        name: {
                            contains: search as string,
                        }
                    }
                }
            }
        }

        switch (processedType) {
            case "default": {
                if (search) {
                    where = {
                        ...where,
                        user: {
                            name: {
                                contains: search as string,
                            }
                        }
                    }
                }
                break;
            };
            case "today": {
                for (let i = subDays(now, 7); i >= subDays(oldestPendingInvestmentDate, 7); i = subDays(i, 7)) {
                    weekly.push(new Date(i))
                };
                for (let i = now; i >= oldestPendingInvestmentDate; i = subMonths(i, 1)) {
                    monthly.push(new Date(i))
                };
                for (let i = now; i >= oldestPendingInvestmentDate; i = subMonths(i, 3)) {
                    quarterly.push(new Date(i))
                };

                where = {
                    ...where,
                    status: "PENDING",
                    OR: [
                        ...weekly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                        ...monthly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                        ...quarterly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                    ]
                };
                break;
            };
            case "week": {
                for (let a = sevenDaysAgo; a >= subDays(sevenDaysAgo, 7); a = subDays(a, 1)) {

                    for (let b = a; b >= oldestPendingInvestmentDate; b = subDays(b, 7)) {
                        weekly.push(new Date(b))
                    }
                    for (let b = a; b >= oldestPendingInvestmentDate; b = subMonths(b, 1)) {
                        monthly.push(new Date(b))
                    }
                    for (let b = a; b >= oldestPendingInvestmentDate; b = subMonths(b, 3)) {
                        quarterly.push(new Date(b))
                    }
                }

                where = {
                    ...where,
                    status: "PENDING",
                    OR: [
                        ...weekly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                        ...monthly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                        ...quarterly.map(date => ({
                            createdAt: {
                                gte: startOfDay(date),
                                lte: endOfDay(date),
                            }
                        })),
                    ]
                };
                break;
            };
            default: {
                where = {
                    ...where,
                    series: {
                        seriesId: parseInt(processedType as string),
                    }
                }
                break;
            }
        }

        const investmentLog = await prisma.investment_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy,
            include: {
                user: true,
                series: {
                    include: {
                        periods: true,
                        rate: true,
                        peakSeason: true,
                    }
                }
            }
        })
        const totalInvestmentLog = await prisma.investment_log.count({ where })

        const processedInvestmentLogs = await Promise.all(
            investmentLog.map(async investment => {
                const lastProfit = await prisma.profit_log.findFirst({
                    where: {
                        investmentLogId: investment.id
                    },
                    orderBy: {
                        createdAt: "desc"
                    },
                    include: {
                        series: {
                            include: {
                                peakSeason: true
                            }
                        }
                    }
                })
                let isPaid: transaction_status = "PENDING"

                const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
                const peakSeasonStartMonth = investment.series.peakSeason?.peakSeasonStartMonth
                const peakSeasonEndMonth = investment.series.peakSeason?.peakSeasonEndMonth
                const isOnPeak = currentMonth >= peakSeasonStartMonth! && currentMonth <= peakSeasonEndMonth!

                if (investment.payoutSchedule === "WEEKLY" && lastProfit) {
                    if (lastProfit.createdAt >= subDays(now, 7)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (investment.payoutSchedule === "MONTHLY" && lastProfit) {
                    if (lastProfit.createdAt >= subMonths(now, 1)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (investment.payoutSchedule === "QUARTERLY" && lastProfit) {
                    if (lastProfit.createdAt >= subMonths(now, 3)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (!lastProfit) {
                    isPaid = "PENDING"
                }
                return {
                    ...investment,
                    isPaid,
                    isOnPeak,
                    settlementRate: investment.settlementRate * 100,
                    peakSettlementRate: investment.peakSettlementRate * 100,
                    leanSettlementRate: investment.leanSettlementRate * 100,
                    user: {
                        ...investment.user,
                        baseSettlementRate: investment.user.baseSettlementRate * 100,
                        referrerPoints: Number(investment.user.referrerPoints),
                    }
                }
            })
        )

        return res.status(200).json({ data: processedInvestmentLogs, total: totalInvestmentLog });
    } catch (error) {
        console.error("Error fetching investment log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { getInvestmentAdditionalData2 } from "../../utils";

export default async function getSeriesLog(req: Request, res: Response) {
    const { page, limit, search, seriesId, type, sort, investmentDate } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;
    const processedSeriesId = (seriesId as string) || "default";
    const processedType = (type as string) || "log";
    const processedSort = (sort as string) || "desc";
    const processedInvestmentDate = investmentDate ? new Date(investmentDate as string) : undefined;

    // change this when series data got changed
    // list here the seriesIds(the number not the actual id)
    // these names must match the filter on the frontend
    let acceptedSeriesId = ["default", "1", "2", "3", "4", "5"];
    if (!acceptedSeriesId.includes(processedSeriesId)) {
        return res.status(400).json({ message: "Invalid series filter" });
    }

    let acceptedTypes = ["log", "details"]
    if (!acceptedTypes.includes(processedType)) {
        return res.status(400).json({ message: "Invalid type filter" });
    }

    let acceptedSort = ["asc", "desc"]
    if (!acceptedSort.includes(processedSort)) {
        return res.status(400).json({ message: "Invalid sort filter" });
    }

    let where: any = {
        status: {
            not: "COMPLETED"
        }
    };
    let name: any = {};
    if (processedType === "log") {
        name = {
            contains: search as string,
        }
    } else {
        name = search
    }

    if (search) {
        where = {
            ...where,
            user: {
                name
            }
        }
    }

    if (processedInvestmentDate) {
        const startOfDay = new Date(processedInvestmentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDate = new Date(startOfDay);
        endOfDate.setUTCDate(endOfDate.getUTCDate() + 1);
        where = {
            ...where,
            createdAt: {
                gte: startOfDay,
                lte: endOfDate
            }
        }
    }

    switch (processedSeriesId) {
        case "default": {
            if (search) {
                where = {
                    ...where,
                    user: {
                        name
                    }
                }
            }
            break;
        }
        default: {
            where = {
                ...where,
                series: {
                    seriesId: parseInt(processedSeriesId as string),
                }
            }
            break;
        }
    }
    try {
        const seriesLog = await prisma.series_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: processedSort as 'asc' | 'desc'
            },
            include: {
                user: true,
                series: {
                    include: {
                        periods: {
                            orderBy: {
                                period: "asc"
                            }
                        },
                        rate: true,
                    }
                },
            }
        })

        const processedSeriesLog = seriesLog.map(log => {
            const { monthly, leanMonthlyProfit, peakMonthlyProfit, estimatedValues, settlementRate, peakSettlementRate, leanSettlementRate } = getInvestmentAdditionalData2({
                // amount is the user's total investment
                amount: log.amount,
                createdAt: log.createdAt,
                series: {
                    periods: log.series.periods,
                    rate: log.series.rate
                }
            })
            return {
                ...log,
                monthly,
                leanMonthlyProfit,
                peakMonthlyProfit,
                settlementRate: settlementRate * 100, //convert from decimal to percent
                peakSettlementRate: peakSettlementRate * 100, //convert from decimal to percent
                leanSettlementRate: leanSettlementRate * 100, //convert from decimal to percent
                estimatedValues,
                user: {
                    ...log.user,
                    baseSettlementRate: log.user.baseSettlementRate * 100, //convert from decimal to percent
                    referrerPoints: Number(log.user.referrerPoints),
                }
            }
        })

        const totalSeriesLog = await prisma.series_log.count({ where })

        return res.status(200).json({ data: processedSeriesLog, total: totalSeriesLog });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
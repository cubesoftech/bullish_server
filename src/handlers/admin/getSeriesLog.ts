import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { getInvestmentAdditionalData2 } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getSeriesLog(req: Request, res: Response) {
    const { page, limit, search, type_, type, sort, investmentDate } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;
    const processedSeriesId = (type_ as string) || "default";
    const processedType = (type as string) || "log";
    const processedSort = (sort as string) || "desc";
    const processedInvestmentDate = investmentDate ? new Date(investmentDate as string) : undefined;

    // change this when series data got changed
    // list here the seriesIds(the number not the actual id)
    // these names must match the filter on the frontend
    let acceptedSeriesId = ["default", "1", "2", "3", "4", "5"];
    if (!acceptedSeriesId.includes(processedSeriesId)) {
        return res.status(400).json({ message: "잘못된 시리즈 필터" });
    }

    let acceptedTypes = ["log", "details"]
    if (!acceptedTypes.includes(processedType)) {
        return res.status(400).json({ message: "잘못된 유형 필터" });
    }

    let acceptedSort = ["asc", "desc"]
    if (!acceptedSort.includes(processedSort)) {
        return res.status(400).json({ message: "잘못된 정렬 필터" });
    }

    let where: Prisma.series_logWhereInput = {
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
                        peakSeason: true,
                    }
                },
            }
        })

        const fiveSecondsAgo = new Date(Date.now() - 1000 * 30);
        const processedSeriesLog = seriesLog.map(log => {
            const { monthly, estimatedValues, settlementRate } = getInvestmentAdditionalData2({
                // amount is the user's total investment
                amount: log.amount,
                investmentDuration: log.investmentDuration,
                payoutSchedule: log.payoutSchedule,
                createdAt: log.createdAt,
                series: {
                    peakSeason: {
                        startMonth: log.series.peakSeason?.peakSeasonStartMonth || 0,
                        endMonth: log.series.peakSeason?.peakSeasonEndMonth || 0,
                    },
                    periods: log.series.periods,
                    rate: log.series.rate
                }
            })

            const peakSettlementRate = log.series.peakSettlementRate * 100
            const leanSettlementRate = log.series.leanSettlementRate * 100
            return {
                ...log,
                isNew: log.createdAt > fiveSecondsAgo,
                monthly,
                leanMonthlyProfit: log.amount * (leanSettlementRate / 100),
                peakMonthlyProfit: log.amount * (peakSettlementRate / 100),
                settlementRate: settlementRate * 100, //convert from decimal to percent
                peakSettlementRate, //convert from decimal to percent
                leanSettlementRate, //convert from decimal to percent
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
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
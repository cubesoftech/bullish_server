import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getProfitLog(req: Request, res: Response) {
    const { page, limit, search, type_, startDate, endDate } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;
    const processedSeriesId = (type_ as string) || "default";
    const processedStartDate = startDate ? new Date(startDate as string) : undefined;
    const processedEndDate = endDate ? new Date(endDate as string) : undefined;

    // change this when series data got changed
    // list here the seriesIds(the number not the actual id)
    // these names must match the filter on the frontend
    let acceptedSeriesId = ["default", "1", "2", "3", "4", "5"];
    if (!acceptedSeriesId.includes(processedSeriesId)) {
        return res.status(400).json({ message: "잘못된 시리즈 필터" });
    }

    let where: Prisma.profit_logWhereInput = {};

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

    if (processedStartDate || processedEndDate) {
        let startOfDay: Date | undefined;
        if (processedStartDate) {
            startOfDay = new Date(processedStartDate);
            startOfDay.setHours(0, 0, 0, 0);
        }
        let endOfDate: Date | undefined;
        if (processedEndDate) {
            endOfDate = new Date(processedEndDate);
            endOfDate.setHours(23, 59, 59, 999);
        }

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
                        name: {
                            contains: search as string,
                        }
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
        const profitLog = await prisma.profit_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
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
        const processedProfitLog = profitLog.map(log => {
            return {
                ...log,
                settlementRate: log.settlementRate * 100, //convert from decimal to percent
                user: {
                    ...log.user,
                    referrerPoints: Number(log.user.referrerPoints),
                }
            }
        })

        const totalProfit = await prisma.profit_log.aggregate({
            _sum: {
                profit: true,
            }
        })

        const totalProfitLog = await prisma.profit_log.count({ where })

        return res.status(200).json({ data: processedProfitLog, totalProfit: totalProfit._sum.profit, total: totalProfitLog });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
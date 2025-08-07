import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

export default async function getInvestmentLog(req: Request, res: Response) {
    const { page, limit, search, seriesId, type } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    // change this when series data got changed
    // list here the seriesIds(the number not the actual id)
    // these names must match the filter on the frontend
    let acceptedSeriesId = ["default", "1", "2", "3", "4", "5"];
    if (!seriesId || !acceptedSeriesId.includes(seriesId as string)) {
        return res.status(400).json({ message: "Invalid series filter" });
    }

    let acceptedTypes = ["log", "details"]
    if (!type || !acceptedTypes.includes(type as string)) {
        return res.status(400).json({ message: "Invalid type filter" });
    }

    let where: any = {};
    let name: any = {};
    if (type === "log") {
        name = {
            contains: search as string,
        }
    } else {
        name = search
    }

    if (search) {
        where = {
            user: {
                name
            }
        }
    }

    switch (seriesId) {
        case "default": {
            if (search) {
                where = {
                    user: {
                        name
                    }
                }
            } else {
                where = {}
            }
            break;
        }
        default: {
            where = {
                ...where,
                series: {
                    seriesId: parseInt(seriesId as string),
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
                createdAt: 'desc'
            },
            include: {
                user: true,
                series: {
                    include: {
                        periods: true,
                        rate: true,
                    }
                },
            }
        })
        const totalSeriesLog = await prisma.series_log.count({ where })

        return res.status(200).json({ data: seriesLog, total: totalSeriesLog });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "Failed to fetch series log" });
    }
}
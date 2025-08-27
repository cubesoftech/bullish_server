import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getSeriesData(req: Request, res: Response) {
    try {
        // TOP INVESTORS
        const topInvestors = await prisma.investment_log.groupBy({
            by: "userId",
            _sum: {
                amount: true,
            },
            _count: {
                _all: true,
            },
            orderBy: {
                _sum: {
                    amount: "desc"
                }
            },
            take: 10
        })

        const users = await prisma.users.findMany({
            where: {
                id: {
                    in: topInvestors.map(investor => investor.userId)
                }
            },
            select: {
                id: true,
                name: true,
            }
        })

        const userMap = new Map(users.map(user => [user.id, user.name]));

        const processedTopInvestors = topInvestors.map(investor => ({
            name: userMap.get(investor.userId) || "",
            total: investor._sum.amount || 0,
            count: investor._count._all || 0,
        }));


        // TOP EARNERS
        const topEarners = await prisma.investment_log.groupBy({
            by: "userId",
            _sum: {
                totalProfit: true,
            },
            _count: {
                _all: true,
            },
            orderBy: {
                _sum: {
                    totalProfit: "desc"
                }
            },
            take: 10
        })

        const users2 = await prisma.users.findMany({
            where: {
                id: {
                    in: topEarners.map(investor => investor.userId)
                }
            },
            select: {
                id: true,
                name: true,
            }
        })

        const userMap2 = new Map(users2.map(user => [user.id, user.name]));

        const processedTopEarners = topEarners.map(investor => ({
            name: userMap2.get(investor.userId) || "",
            total: investor._sum.totalProfit || 0,
            count: investor._count._all || 0,
        }));


        // SERIES DATA
        const seriesList = await prisma.series.findMany({
            orderBy: {
                seriesId: "asc"
            },
            select: {
                id: true
            }
        })

        const seriesCount = await prisma.series_log.groupBy({
            by: "seriesId",
            _count: {
                _all: true
            },
            where: {
                seriesId: {
                    in: seriesList.map(s => s.id)
                }
            }
        })
        const seriesData: Record<string, number> = {}

        seriesList.forEach((series, index) => {
            const count = seriesCount.find(s => s.seriesId === series.id)?._count._all || 0
            seriesData[`series${index + 1}`] = count
        })

        return res.status(200).json({
            data: {
                topInvestors: processedTopInvestors,
                topEarners: processedTopEarners,
                seriesData
            }
        })
    } catch (error) {
        console.error("Error fetching series data:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
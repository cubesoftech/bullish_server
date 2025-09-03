import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getInvestmentLog(req: Request, res: Response) {
    const { page, limit, search, seriesId } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 25;
    const processedSeriesId = (seriesId as string) || "default";

    let acceptedSeriesId = ["default", "1", "2", "3", "4", "5"];
    if (!acceptedSeriesId.includes(processedSeriesId)) {
        return res.status(400).json({ message: "Invalid series filter" });
    }

    let where: Prisma.investment_logWhereInput = {}

    if (search) {
        where = {
            user: {
                name: {
                    contains: search as string,
                }
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
        const investmentLog = await prisma.investment_log.findMany({
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
                        peakSeason: true,
                    }
                }
            }
        })
        const totalInvestmentLog = await prisma.investment_log.count({ where })

        const processedInvestmentLogs = investmentLog.map(investment => ({
            ...investment,
            settlementRate: investment.settlementRate * 100,
            peakSettlementRate: investment.peakSettlementRate * 100,
            leanSettlementRate: investment.leanSettlementRate * 100,
            user: {
                ...investment.user,
                baseSettlementRate: investment.user.baseSettlementRate * 100,
                referrerPoints: Number(investment.user.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedInvestmentLogs, total: totalInvestmentLog });
    } catch (error) {
        console.error("Error fetching investment log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { Prisma } from "@prisma/client";

export default async function getExtendInvestmentDurationLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.extend_investment_duration_logWhereInput = {}

    if (search) {
        where = {
            user: {
                name: {
                    contains: search as string,
                }
            }
        }
    }
    try {
        const requests = await prisma.extend_investment_duration_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true,
                investmentLog: {
                    include: {
                        series: true
                    }
                },
            }
        })
        const totalRequests = await prisma.extend_investment_duration_log.count({ where })

        const processedDirectInquiries = requests.map(request => ({
            ...request,
            user: {
                ...request.user,
                referrerPoints: Number(request.user.referrerPoints),
            },
            investmentLog: {
                ...request.investmentLog,
                settlementRate: request.investmentLog.settlementRate * 100,
                peakSettlementRate: request.investmentLog.peakSettlementRate * 100,
                leanSettlementRate: request.investmentLog.leanSettlementRate * 100,
            }
        }))

        return res.status(200).json({ data: processedDirectInquiries, total: totalRequests });
    } catch (error) {
        console.error("Error fetching direct inquiries: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
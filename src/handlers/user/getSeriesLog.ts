import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function getSeriesLog(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        const where = {
            userId: userInfo.id
        }
        const investmentLogs = await prisma.series_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true,
                series: true,
            }
        })
        const totalInvestmentLogs = await prisma.inquiry_log.count({ where });

        const processedInvestmentLogs = investmentLogs.map(log => ({
            ...log,
            user: {
                ...log.user,
                referrerPoints: Number(log.user.referrerPoints)
            }
        }))

        return res.status(200).json({ data: processedInvestmentLogs, total: totalInvestmentLogs });
    } catch (error) {
        console.error("Error fetching inquiries: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
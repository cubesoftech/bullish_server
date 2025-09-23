import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getReferralProfitLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {}

    if (search) {
        where = {
            user: {
                name: search
            }
        }
    }

    try {
        const referralProfitLog = await prisma.monthly_referrer_profit_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: true,
            }
        })
        const totalReferralProfitLogs = await prisma.monthly_referrer_profit_log.count({ where })

        const processedReferralProfitLogs = referralProfitLog.map(log => ({
            ...log,
            user: {
                ...log.user,
                referrerPoints: Number(log.user?.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedReferralProfitLogs, total: totalReferralProfitLogs });
    } catch (error) {
        console.error("Error fetching deposit requests: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
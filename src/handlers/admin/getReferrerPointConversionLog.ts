import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getReferrerPointConversionLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.referrer_point_conversion_logWhereInput = {}

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
        const referrerPointConversionLog = await prisma.referrer_point_conversion_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true,
            }
        })
        const totalReferrerPointConversionLog = await prisma.referrer_point_conversion_log.count({ where })

        const processedReferrerPointConversionLog = referrerPointConversionLog.map(log => ({
            ...log,
            user: {
                ...log.user,
                baseSettlementRate: Number(log.user.baseSettlementRate) * 100,
                referrerPoints: Number(log.user.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedReferrerPointConversionLog, total: totalReferrerPointConversionLog });
    } catch (error) {
        console.error("Error fetching getReferrerPointConversionLog: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
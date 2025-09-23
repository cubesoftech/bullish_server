import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getReferrerPointConversionLog(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const where: Prisma.referrer_point_conversion_logWhereInput = {
            userId: user.id,
        }

        const referrerPointCoinversionLog = await prisma.referrer_point_conversion_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                user: true
            }
        });
        const totalReferrerPointConversionLog = await prisma.referrer_point_conversion_log.count({ where })

        const processedReferrerPointConversionLog = referrerPointCoinversionLog.map(log => ({
            ...log,
            user: {
                ...log.user,
                baseSettlementRate: Number(log.user.baseSettlementRate) * 100,
                referrerPoints: Number(log.user.referrerPoints)
            }
        }))

        return res.status(200).json({ data: processedReferrerPointConversionLog, total: totalReferrerPointConversionLog })
    } catch (error) {
        console.log("Error on getReferrerPointLog: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
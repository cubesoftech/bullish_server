import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getReferrerPointLog(req: Request, res: Response) {
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

        const where: Prisma.monthly_referrer_profit_logWhereInput = {
            userId: user.id,
            type: "REFERRER2"
        }

        const referrerPointLog = await prisma.monthly_referrer_profit_log.findMany({
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
        const totalReferrerPointLog = await prisma.monthly_referrer_profit_log.count({ where })

        const processedReferrerPointLog = referrerPointLog.map(log => ({
            ...log,
            user: {
                ...log.user,
                baseSettlementRate: Number(log.user.baseSettlementRate) * 100,
                referrerPoints: Number(log.user.referrerPoints)
            }
        }))

        return res.status(200).json({ data: processedReferrerPointLog, total: totalReferrerPointLog })
    } catch (error) {
        console.log("Error on getReferrerPointLog: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
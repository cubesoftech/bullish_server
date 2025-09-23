import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getProfitLog(req: Request, res: Response) {
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

        const where: Prisma.profit_logWhereInput = {
            userId: user.id,
        }

        const profitLog = await prisma.profit_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                series: true,
                investmentLog: true,
            }
        });
        const totalProfitLog = await prisma.profit_log.count({ where })

        const processedProfitLog = profitLog.map(log => {
            return {
                ...log,
                settlementRate: log.settlementRate * 100, //convert from decimal to percent
                investmentLog: {
                    ...log.investmentLog,
                    settlementRate: log.investmentLog.settlementRate * 100, //convert from decimal to percent
                }
            }
        })

        return res.status(200).json({ data: processedProfitLog, total: totalProfitLog })
    } catch (error) {
        console.log("Error on getProfitLog: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
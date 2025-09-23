import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getDepositLog(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    const now = new Date();

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const where: Prisma.deposit_logWhereInput = {
            userId: user.id,
        }

        const endingnvestments = await prisma.deposit_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
        });
        const totalEndingInvestments = await prisma.deposit_log.count({ where })

        return res.status(200).json({ data: endingnvestments, total: totalEndingInvestments })
    } catch (error) {
        console.log("Error on getEndingInvestments: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
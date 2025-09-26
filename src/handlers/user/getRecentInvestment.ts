import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getRecentInvestment(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." })
    }

    const now = new Date();
    now.setDate(1)
    try {

        const recentInvestments = await prisma.investment_log.findMany({
            where: {
                userId: user.id,
                createdAt: {
                    gte: now
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        const totalRecentInvestments = await prisma.investment_log.count({
            where: {
                userId: user.id,
                createdAt: {
                    gte: now
                }
            },
        })

        return res.status(200).json({ data: recentInvestments, total: totalRecentInvestments })

    } catch (error) {
        console.log("Error on user getRecentInvestment: ", error)
        return res.status(500).json({ message: "내부 서버 오류" })
    }
}
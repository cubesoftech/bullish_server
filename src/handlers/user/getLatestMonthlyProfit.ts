import { Request, Response } from "express";
import { findUser } from "../../utils";
import { prisma } from "../../utils/prisma";

export default async function getLatestMonthlyProfit(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const monthlyProfit = await prisma.profit_log.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                // get the last created
                createdAt: "desc"
            },
            // take the last 6 months
            take: 6
        });

        return res.status(200).json({ data: monthlyProfit });
    } catch (error) {
        console.log("Error on getLastMonthlyProfit: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
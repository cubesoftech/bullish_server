import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getOngoingInvestment(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." })
        }

        const where: Prisma.investment_logWhereInput = {
            userId: user.id,
            status: "PENDING"
        }

        const ongoingInvestments = await prisma.investment_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                series: true
            }
        });
        const totalOngoingInvestments = await prisma.investment_log.count({ where })

        return res.status(200).json({ data: ongoingInvestments, total: totalOngoingInvestments })
    } catch (error) {
        console.log("Error on getOngoingInvestment: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
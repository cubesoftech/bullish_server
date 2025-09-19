import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { Prisma } from "@prisma/client";
import { addMonths, subMonths } from "date-fns";

export default async function getEndingInvestments(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    const now = new Date();

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." })
        }

        const where: Prisma.investment_logWhereInput = {
            userId: user.id,
            status: "PENDING",
            maturityDate: {
                lt: addMonths(now, 2),
            }
        }

        const endingnvestments = await prisma.investment_log.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            include: {
                series: true,
            }
        });
        const totalEndingInvestments = await prisma.investment_log.count({ where })

        return res.status(200).json({ data: endingnvestments, total: totalEndingInvestments })
    } catch (error) {
        console.log("Error on getEndingInvestments: ", error)
        return res.status(500).json({ message: "Internal server error" });
    }
}
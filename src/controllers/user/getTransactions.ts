import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";
import { Prisma } from "@prisma/client";


export default async function getTransactions(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { limit, page, type } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    const processedType = type as "deposit" | "withdrawal" || "deposit"

    const where: Prisma.transactionWhereInput = {
        membersId: user.id,
        type: processedType
    }
    try {

        const transactions = await prisma.transaction.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
        })
        const totalTransactions = await prisma.transaction.count({ where })

        return res.status(200).json({
            total: totalTransactions,
            data: transactions
        })

    } catch (error) {
        console.log("Error user | getTransactions:", error);
        return next()
    }
}
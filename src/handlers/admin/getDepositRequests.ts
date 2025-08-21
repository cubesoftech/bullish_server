import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getDepositRequests(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {}

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
        const deposits = await prisma.deposit_log.findMany({
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
        const totalDeposits = await prisma.deposit_log.count({ where })

        const processedDeposits = deposits.map(deposit => ({
            ...deposit,
            user: {
                ...deposit.user,
                referrerPoints: Number(deposit.user?.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedDeposits, total: totalDeposits });
    } catch (error) {
        console.error("Error fetching deposit requests: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { Prisma } from "@prisma/client";

export default async function getDepositRequests(req: Request, res: Response) {
    const { page, limit, search, sortCreatedBy, sortAmount, type } = req.query;

    const acceptedSort = ['asc', 'desc'];

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;
    const processedType = (type as string) || "log";

    let where: any = {}
    let name: any = {};
    let orderBy: Prisma.deposit_logOrderByWithRelationInput[] = [
        { createdAt: "desc" as "asc" | "desc" }
    ];

    let acceptedTypes = ["log", "details"]
    if (!acceptedTypes.includes(processedType)) {
        return res.status(400).json({ message: "Invalid type filter" });
    }

    if (processedType === "log") {
        name = {
            contains: search as string,
        }
    } else {
        name = search
    }

    if (search) {
        where = {
            user: {
                name
            }
        }
    }

    if (sortCreatedBy && acceptedSort.includes(sortCreatedBy as string)) {
        orderBy = [
            {
                createdAt: sortCreatedBy as "asc" | "desc"
            }
        ];
    } else if (sortAmount && acceptedSort.includes(sortAmount as string)) {
        orderBy = [
            {
                amount: sortAmount as "asc" | "desc"
            }
        ];
    }
    try {
        const deposits = await prisma.deposit_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy,
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
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { getInvestmentAdditionalData2 } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getUserDeletionRequests(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.user_deletion_requestWhereInput = {
        status: {
            not: "COMPLETED"
        }
    };

    if (search) {
        where = {
            ...where,
            user: {
                name: {
                    contains: search as string
                }
            }
        }
    }

    try {
        const deletionRequestLog = await prisma.user_deletion_request.findMany({
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

        const processedDeletionRequestLog = deletionRequestLog.map(log => {
            return {
                ...log,
                user: {
                    ...log.user,
                    baseSettlementRate: log.user.baseSettlementRate * 100, //convert from decimal to percent
                    referrerPoints: Number(log.user.referrerPoints),
                }
            }
        })

        const totalDeletionRequestLog = await prisma.user_deletion_request.count({ where })

        return res.status(200).json({ data: processedDeletionRequestLog, total: totalDeletionRequestLog });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
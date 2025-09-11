import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { getInvestmentAdditionalData2 } from "../../utils";
import { Prisma } from "@prisma/client";

export default async function getDeletedUsers(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.usersWhereInput = {
        isDeleted: true
    };

    if (search) {
        where = {
            ...where,
            name: {
                contains: search as string
            }
        }
    }

    try {
        const deletedUsers = await prisma.users.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            }
        })

        const processedDeletedUsers = await Promise.all(
            deletedUsers.map(async (user) => {
                const deleted = await prisma.user_deletion_request.findMany({
                    where: {
                        userId: user.id,
                        status: "COMPLETED"
                    },
                    orderBy: {
                        updatedAt: 'desc'
                    }
                })
                return {
                    ...user,
                    baseSettlementRate: user.baseSettlementRate * 100, //convert from decimal to percent
                    referrerPoints: Number(user.referrerPoints),
                    deletedAt: deleted.length > 0 ? deleted[0].updatedAt : null,
                }
            })
        )

        const totalDeletedUsers = await prisma.users.count({ where })

        return res.status(200).json({ data: processedDeletedUsers, total: totalDeletedUsers });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
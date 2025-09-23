import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getUsers(req: Request, res: Response) {
    const { page, limit, search, sortTotalInvestment, sortCreatedBy } = req.query;

    const acceptedCreatedBySort = ['asc', 'desc'];

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;
    const processedCreatedBySort =
        sortCreatedBy && acceptedCreatedBySort.includes(sortCreatedBy as string)
            ? (sortCreatedBy as string)
            : "desc";

    const acceptedTotalInvestmentSort = ['asc', 'desc'];

    let where: Prisma.usersWhereInput = {
        status: true,
        isDeleted: false,
    }

    if (search) {
        where = {
            status: true,
            isDeleted: false,
            OR: [
                {
                    name: {
                        contains: search as string,
                    }
                },
                {
                    id: {
                        contains: search as string
                    }
                }
            ]
        }
    }
    try {
        const users = await prisma.users.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: processedCreatedBySort as "asc" | "desc"
            },
            include: {
                referrer: true,
                referrerAgent: true,
            }
        })
        const totalUsers = await prisma.users.count({ where })

        const processedUsers = await Promise.all(
            users.map(async (user) => {
                const totalInvestment = await prisma.investment_log.aggregate({
                    where: {
                        userId: user.id,
                    },
                    _sum: {
                        amount: true,
                    }
                })
                return {
                    ...user,
                    referrerPoints: Number(user.referrerPoints),
                    isReferreredByAgent: user.referrerAgentId !== null,
                    totalInvestment: totalInvestment._sum.amount ?? 0,
                    referrer: {
                        ...user.referrer,
                        referrerPoints: Number(user.referrer?.referrerPoints),
                    }
                }
            })
        )

        if (sortTotalInvestment && acceptedTotalInvestmentSort.includes(sortTotalInvestment as string)) {
            processedUsers.sort((a, b) => {
                if (sortTotalInvestment === 'asc') {
                    return a.totalInvestment - b.totalInvestment;
                } else {
                    return b.totalInvestment - a.totalInvestment;
                }
            });
        }

        return res.status(200).json({ data: processedUsers, total: totalUsers });
    } catch (error) {
        console.error("Error fetching users: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
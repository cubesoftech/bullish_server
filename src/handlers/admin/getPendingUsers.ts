import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getPendingUsers(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {
        status: false
    }

    if (search) {
        where = {
            status: false,
            name: {
                contains: search as string,
            }
        }
    }
    try {
        const pendingUsers = await prisma.users.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                referrer: true,
                referrerAgent: true
            }
        })
        const totalPendingUsers = await prisma.users.count({ where })

        const processedPendingUsers = pendingUsers.map(user => ({
            ...user,
            referrerPoints: Number(user.referrerPoints),
            isReferreredByAgent: user.referrerAgentId !== null,
            referrer: {
                ...user.referrer,
                referrerPoints: Number(user.referrer?.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedPendingUsers, total: totalPendingUsers });
    } catch (error) {
        console.error("Error fetching pending users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
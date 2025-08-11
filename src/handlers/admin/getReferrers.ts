import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

export default async function getReferrers(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {
        referredUsers: {
            some: {}
        },
    }

    if (search) {
        where = {
            referredUsers: {
                some: {}
            },
            name: {
                contains: search as string,
            }
        }
    }
    try {
        const referrers = await prisma.users.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                referredUsers: true,
            }
        })
        const totalReferrers = await prisma.users.count({ where })

        return res.status(200).json({ data: referrers, total: totalReferrers });
    } catch (error) {
        console.error("Error fetching referrers: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
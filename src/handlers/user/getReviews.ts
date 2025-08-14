import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getReviews(req: Request, res: Response) {
    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    let where: any = {
        status: "COMPLETED"
    }

    try {
        const reviews = await prisma.review_log.findMany({
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
        const totalReviews = await prisma.review_log.count({ where });

        return res.status(200).json({ data: reviews, total: totalReviews });
    } catch (error) {
        console.error("Error fetching reviews: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
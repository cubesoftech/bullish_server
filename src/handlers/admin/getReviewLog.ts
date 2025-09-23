import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getReviewLog(req: Request, res: Response) {
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
        const totalReviews = await prisma.review_log.count({ where })

        const processedReviews = reviews.map(review => ({
            ...review,
            user: {
                ...review.user,
                referrerPoints: Number(review.user?.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedReviews, total: totalReviews });
    } catch (error) {
        console.error("Error fetching review requests: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
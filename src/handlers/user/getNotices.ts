import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getNotices(req: Request, res: Response) {
    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    try {
        const notices = await prisma.notices.findMany({
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
        });
        const totalNotices = await prisma.notices.count();

        return res.status(200).json({ data: notices, total: totalNotices });
    } catch (error) {
        console.error("Error fetching notices: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
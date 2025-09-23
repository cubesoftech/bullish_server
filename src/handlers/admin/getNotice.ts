import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

export default async function getNotice(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {}

    if (search) {
        where = {
            title: {
                contains: search as string,
            }
        }
    }
    try {
        const notices = await prisma.notices.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            }
        })
        const totalNotices = await prisma.notices.count({ where })

        return res.status(200).json({ data: notices, total: totalNotices });
    } catch (error) {
        console.error("Error fetching notices: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
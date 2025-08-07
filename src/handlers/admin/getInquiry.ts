import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

export default async function getInquiry(req: Request, res: Response) {
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
        const inquiries = await prisma.inquiry_log.findMany({
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
        const totalInquiries = await prisma.inquiry_log.count({ where })

        return res.status(200).json({ data: inquiries, total: totalInquiries });
    } catch (error) {
        console.error("Error fetching inquiries: ", error);
        return res.status(500).json({ message: "Failed to fetch inquiries" });
    }
}
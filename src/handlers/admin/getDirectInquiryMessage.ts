import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getDirectInquiryMessages(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: any = {}

    if (search) {
        where = {
            directInquiryId: search as string
        }
    }
    try {
        const directInquiryMessages = await prisma.direct_inquiry_messages.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                directInquiry: true,
            }
        })
        const totalDirectInquiryMessages = await prisma.direct_inquiry_messages.count({ where })

        directInquiryMessages.reverse()

        return res.status(200).json({ data: directInquiryMessages, total: totalDirectInquiryMessages });
    } catch (error) {
        console.error("Error fetching direct inquiries: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
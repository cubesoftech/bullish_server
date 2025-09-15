import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getDirectInquiryLog(req: Request, res: Response) {
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
        const directInquiries = await prisma.direct_inquiry.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                user: true,
                directInquiryMessages: {
                    take: processedLimit,
                    skip: (processedPage - 1) * processedLimit,
                    orderBy: {
                        createdAt: 'desc'
                    },
                },
            }
        })
        const totalDirectInquiries = await prisma.direct_inquiry.count({ where })

        const processedDirectInquiries = directInquiries.map(inquiry => ({
            ...inquiry,
            user: {
                ...inquiry.user,
                referrerPoints: Number(inquiry.user.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedDirectInquiries, total: totalDirectInquiries });
    } catch (error) {
        console.error("Error fetching direct inquiries: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
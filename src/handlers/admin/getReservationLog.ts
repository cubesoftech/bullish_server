import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getReservationLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.reservation_logWhereInput = {
    }

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
        const inquiries = await prisma.reservation_log.findMany({
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
        const totalInquiries = await prisma.reservation_log.count({ where })

        const processedReferrers = inquiries.map(inquiry => ({
            ...inquiry,
            isReplied: inquiry.reply.trim() !== "",
            user: {
                ...inquiry.user,
                referrerPoints: Number(inquiry.user.referrerPoints),
            }
        }))

        return res.status(200).json({ data: processedReferrers, total: totalInquiries });
    } catch (error) {
        console.error("Error fetching referrers: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
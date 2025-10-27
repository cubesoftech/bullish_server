import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";

export default async function getAnnouncement(req: Request, res: Response, next: NextFunction) {
    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    const where: Prisma.announcementWhereInput = {}

    try {
        const announcements = await prisma.announcement.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
        })

        const totalAnnouncements = await prisma.announcement.count({ where })

        return res.status(200).json({
            total: totalAnnouncements,
            data: announcements
        })
    } catch (error) {
        console.log("Error user | getAnnountment:", error);
        return next()
    }
}
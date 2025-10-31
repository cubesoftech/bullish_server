import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";

export default async function getInquiries(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    const where: Prisma.inquiriesWhereInput = {
        memberId: user.id,
        alreadyAnswered: true,
    }

    try {
        const inquiries = await prisma.inquiries.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
        })

        const totalInquiries = await prisma.inquiries.count({ where })

        return res.status(200).json({
            total: totalInquiries,
            data: inquiries
        })
    } catch (error) {
        console.log("Error user | getInquiries:", error);
        return next()
    }
}
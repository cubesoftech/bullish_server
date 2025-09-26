import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { Prisma } from "@prisma/client";

export default async function getPopupImages(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.popupsWhereInput = {
    }

    if (search) {
        where = {
            title: {
                contains: search as string,
            }
        }
    }
    try {
        const popupImages = await prisma.popups.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
        })
        const totalPopupImages = await prisma.popups.count({ where })

        return res.status(200).json({ data: popupImages, total: totalPopupImages });
    } catch (error) {
        console.error("Error fetching popup images: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
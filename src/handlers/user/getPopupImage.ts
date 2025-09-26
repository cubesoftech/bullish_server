import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getPopupImages(req: Request, res: Response) {
    try {
        const popups = await prisma.popups.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc'
            },
        })

        return res.status(200).json({ data: popups });
    } catch (error) {
        console.log("Error in getPopupImages:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
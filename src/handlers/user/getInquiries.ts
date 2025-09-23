import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function getInquiries(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    const { limit, page } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const where = {
            userId: userInfo.id
        }
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
        const totalInquiries = await prisma.inquiry_log.count({ where });

        const processedInquiries = inquiries.map(inquiry => ({
            ...inquiry,
            user: {
                ...inquiry.user,
                referrerPoints: Number(inquiry.user.referrerPoints)
            }
        }))

        return res.status(200).json({ data: processedInquiries, total: totalInquiries });
    } catch (error) {
        console.error("Error fetching inquiries: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
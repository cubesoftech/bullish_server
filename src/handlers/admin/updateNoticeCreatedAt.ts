import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateNoticeCreatedAtPayload {
    noticeId: string;
    newCreatedAt: string;
}

export default async function updateNoticeCreatedAt(req: Request, res: Response) {
    const { noticeId, newCreatedAt } = req.body as UpdateNoticeCreatedAtPayload;

    if (!noticeId || noticeId.trim() === "") {
        return res.status(400).json({ message: "잘못된 공지 ID." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "잘못된 새로운 공지 날짜입니다." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const notice = await prisma.notices.findUnique({
            where: {
                id: noticeId
            }
        })
        if (!notice) {
            return res.status(404).json({ message: "공지사항을 찾을 수 없습니다." })
        }

        await prisma.notices.update({
            where: {
                id: notice.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "투자 수익이 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateProfitCreatedAt: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
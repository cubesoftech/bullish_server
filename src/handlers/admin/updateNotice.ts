import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface UpdateNoticePayload {
    id: string;
    title: string;
    content: string;
}

export default async function updateNotice(req: Request, res: Response) {
    const body = req.body as UpdateNoticePayload;

    if (
        (!body.id || body.id.trim() === "") ||
        (!body.title || body.title.trim() === "") ||
        (!body.content || body.content.trim() === "")
    ) {
        return res.status(400).json({ message: "ID, 제목, 내용은 필수입니다." });
    }

    try {
        await prisma.notices.update({
            where: {
                id: body.id
            },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ message: "공지사항이 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error creating notice:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
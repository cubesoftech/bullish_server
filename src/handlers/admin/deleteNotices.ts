import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteNoticePayload {
    ids: string[];
}

export default async function deleteNotice(req: Request, res: Response) {
    const { ids } = req.body as DeleteNoticePayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "잘못된 요청 데이터입니다." });
    }

    try {
        await prisma.notices.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "공지사항이 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting notices: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteActivityLogPayload {
    ids: string[];
}

export default async function deleteActivityLog(req: Request, res: Response) {
    const { ids } = req.body as DeleteActivityLogPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "잘못된 ID입니다." });
    }

    try {
        await prisma.activity_log.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "활동 로그가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting activity logs: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
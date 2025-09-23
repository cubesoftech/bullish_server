import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface DeleteUserRequestPayload {
    ids: string[];
}

export default async function deleteUserRequest(req: Request, res: Response) {
    const { ids } = req.body as DeleteUserRequestPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "사용자 ID가 제공되지 않았습니다." });
    }

    try {
        await prisma.users.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting users:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
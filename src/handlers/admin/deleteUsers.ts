import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteUserPayload {
    users: string[]
}

export default async function deleteUsers(req: Request, res: Response) {
    const { users } = req.body as DeleteUserPayload;

    if (!users || users.length === 0) {
        return res.status(400).json({ message: "사용자가 제공되지 않았습니다." });
    }

    try {
        await prisma.users.updateMany({
            where: {
                id: {
                    in: users
                }
            },
            data: {
                isDeleted: true,
            }
        });

        return res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting users: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
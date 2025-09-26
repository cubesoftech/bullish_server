import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateAdminNotePayload {
    note: string
}

export default async function updateAdminNote(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." })
    }

    const { note } = req.body as UpdateAdminNotePayload

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                id: user.id
            }
        })
        if (!admin) {
            return res.status(404).json({ message: "관리자를 찾을 수 없습니다." })
        }

        await prisma.admin.update({
            where: {
                id: admin.id
            },
            data: {
                note,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "노트가 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.error("Error on admin updateAdminNote: ", error)
        return res.status(500).json({ message: "내부 서버 오류" })
    }
}
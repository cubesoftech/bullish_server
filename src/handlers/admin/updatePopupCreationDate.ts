import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdatePopupCreatedAtPayload {
    popupId: string;
    newCreatedAt: string;
}

export default async function updatePopupCreationDate(req: Request, res: Response) {
    const { popupId, newCreatedAt } = req.body as UpdatePopupCreatedAtPayload;

    if (!popupId || popupId.trim() === "") {
        return res.status(400).json({ message: "잘못된 팝업 ID." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "잘못된 새로운 팝업 날짜입니다." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const popup = await prisma.popups.findUnique({
            where: {
                id: popupId
            }
        })
        if (!popup) {
            return res.status(404).json({ message: "팝업을 찾을 수 없습니다." })
        }

        await prisma.popups.update({
            where: {
                id: popup.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "팝업 생성일이 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updatePopupCreationDate: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
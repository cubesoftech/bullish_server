import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";

interface DeletePopupImagePayload {
    popupId: string;
}

export default async function deletePopupImage(req: Request, res: Response) {
    const { popupId } = req.body as DeletePopupImagePayload;

    if (!popupId) {
        return res.status(400).json({ message: "팝업 ID가 제공되지 않았습니다." });
    }

    try {
        const popup = await prisma.popups.findUnique({
            where: { id: popupId }
        });

        if (!popup) {
            return res.status(404).json({ message: "팝업 이미지를 찾을 수 없습니다." });
        }

        const { id, publicId } = popup;

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Delete from Database
        await prisma.popups.delete({
            where: {
                id
            }
        });

        return res.status(200).json({ message: "팝업 이미지가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting popup image:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
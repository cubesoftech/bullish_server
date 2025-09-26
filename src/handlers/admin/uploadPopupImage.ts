import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import cloudinary from "../../utils/cloudinary";
import { generateRandomString } from "../../utils";
import fs from "fs/promises"

export default async function uploadPopupImage(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
        }

        const file = req.file;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "trusseon_popup_images",
            use_filename: false,
            unique_filename: true,
            overwrite: true,
        });

        // Save the image URL to the database
        await prisma.popups.create({
            data: {
                id: generateRandomString(7),
                secureUrl: result.secure_url,
                publicId: result.public_id,
                title: "",
                desc: "",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await fs.unlink(file.path);

        return res.status(201).json({ message: "팝업 이미지가 성공적으로 업로드되었습니다.", });
    } catch (error) {
        console.error("Error in uploadPopupImage:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface CreateInquiryPayload {
    userId: string;
    content: string;
}

export default async function createInquiry(req: Request, res: Response) {
    const { userId, content } = req.body as CreateInquiryPayload;

    if (
        (!userId || userId.trim() === "")
        || (!content || content.trim() === "")
    ) {
        return res.status(400).json({ message: "사용자 ID와 내용은 필수입니다." });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        await prisma.inquiry_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                content,
                reply: "",
                isReplied: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        return res.status(201).json({ message: "문의가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error creating inquiry: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
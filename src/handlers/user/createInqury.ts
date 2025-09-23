import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface CreateInquiryPayload {
    content: string;
}

export default async function createInquiry(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    const body = req.body as CreateInquiryPayload;

    const validateFields = !(
        !body.content ||
        body.content.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "잘못된 문의 필드입니다." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        await prisma.inquiry_log.create({
            data: {
                id: generateRandomString(7),
                ...body,
                reply: "",
                userId: userInfo.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await notifyAdmin();

        return res.status(200).json({ message: "문의가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error creating inquiry: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
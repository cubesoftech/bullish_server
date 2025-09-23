import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyOnlineUsers } from "../core/socketConnection";

interface CreateDirectInquiryPayload {
    userId: string;
    content: string;
}

export default async function createDirectInquiry(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." })
    }
    const { id } = user

    const { userId, content } = req.body as CreateDirectInquiryPayload
    if (!userId || userId.trim() === "") {
        return res.status(400).json({ message: "잘못된 사용자 ID입니다." })
    }

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "잘못된 메시지입니다." })
    }

    try {
        const admin = await prisma.admin.findFirst({
            where: {
                id
            }
        })
        if (!admin) {
            return res.status(404).json({ message: "관리자를 찾을 수 없습니다." })
        }

        const userInfo = await prisma.users.findFirst({
            where: {
                id: userId
            }
        })
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        await prisma.direct_inquiry.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                isUserReplied: false,
                isAdminReplied: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                directInquiryMessages: {
                    create: {
                        id: generateRandomString(7),
                        senderId: admin.id,
                        content,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            }
        })

        notifyOnlineUsers(user.id)

        return res.status(200).json({ message: "쪽지가 성공적으로 전송되었습니다." })
    } catch (error) {
        console.log("Error on admin createDirectInquiry: ", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
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
        return res.status(401).json({ message: "Unauthorized." })
    }
    const { id } = user

    const { userId, content } = req.body as CreateDirectInquiryPayload
    if (!userId || userId.trim() === "") {
        return res.status(400).json({ message: "Invalid user id" })
    }

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Invalid message." })
    }

    try {
        const admin = await prisma.admin.findFirst({
            where: {
                id
            }
        })
        if (!admin) {
            return res.status(404).json({ message: "Admin not found." })
        }

        const userInfo = await prisma.users.findFirst({
            where: {
                id: userId
            }
        })
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." })
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

        return res.status(200).json({ message: "Direct message sent successfully." })
    } catch (error) {
        console.log("Error on admin createDirectInquiry: ", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
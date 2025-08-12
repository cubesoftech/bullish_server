import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyOnlineUsers } from "../..";

interface ReplyDirectInquiryPayload {
    inquiryId: string;
    content: string;
}

export default async function replyDirectInquiry(req: Request, res: Response) {
    const { inquiryId, content } = req.body as ReplyDirectInquiryPayload;

    if (!inquiryId || inquiryId.trim() === "" || !content || content.trim() === "") {
        return res.status(400).json({ message: "Inquiry ID and reply content are required" });
    }

    try {
        const directInquiry = await prisma.direct_inquiry.findUnique({
            where: {
                id: inquiryId,
            },
        });
        if (!directInquiry) {
            return res.status(404).json({ message: "Direct inquiry not found" });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.direct_inquiry_messages.create({
                data: {
                    id: generateRandomString(7),
                    directInquiryId: directInquiry.id,
                    receiverId: directInquiry.userId,
                    content,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            await tx.direct_inquiry.update({
                where: {
                    id: directInquiry.id
                },
                data: {
                    isAdminReplied: true,
                    isUserReplied: false,
                    updatedAt: new Date(),
                }
            })
        })

        // send notification to receiver
        notifyOnlineUsers(directInquiry.userId)

        return res.status(200).json({ message: "Direct inquiry replied successfully" });
    } catch (error) {
        console.error("Error replying to direct inquiry: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
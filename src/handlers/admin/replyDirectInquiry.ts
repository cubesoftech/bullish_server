import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyOnlineUsers } from "../core/socketConnection";

interface ReplyDirectInquiryPayload {
    inquiryId: string;
    content: string;
}

export default async function replyDirectInquiry(req: Request, res: Response) {
    const { inquiryId, content } = req.body as ReplyDirectInquiryPayload;

    if (!inquiryId || inquiryId.trim() === "" || !content || content.trim() === "") {
        return res.status(400).json({ message: "문의 ID와 답변 내용은 필수입니다." });
    }

    try {
        const directInquiry = await prisma.direct_inquiry.findUnique({
            where: {
                id: inquiryId,
            },
        });
        if (!directInquiry) {
            return res.status(404).json({ message: "Direct 문의를 찾을 수 없습니다." });
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

        return res.status(200).json({ message: "Direct 문의가 성공적으로 답변되었습니다." });
    } catch (error) {
        console.error("Error replying to direct inquiry: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
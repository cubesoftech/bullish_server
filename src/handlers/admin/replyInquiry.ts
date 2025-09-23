import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ReplyInquiryPayload {
    inquiryId: string;
    reply: string;
}

export default async function replyInquiry(req: Request, res: Response) {
    const { inquiryId, reply } = req.body as ReplyInquiryPayload;

    if (!inquiryId || inquiryId.trim() === "" || !reply || reply.trim() === "") {
        return res.status(400).json({ message: "문의 ID와 답변 내용은 필수입니다." });
    }

    try {
        const inquiry = await prisma.inquiry_log.findUnique({
            where: {
                id: inquiryId,
                isReplied: false,
            },
        });
        if (!inquiry) {
            return res.status(404).json({ message: "문의를 찾을 수 없습니다." });
        }

        await prisma.inquiry_log.update({
            where: { id: inquiryId },
            data: {
                reply,
                isReplied: true,
                updatedAt: new Date(),
            }
        });
        return res.status(200).json({ message: "문의가 성공적으로 답변되었습니다." });
    } catch (error) {
        console.error("Error replying to inquiry: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
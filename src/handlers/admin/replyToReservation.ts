import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ReplyToReservationPayload {
    inquiryId: string;
    reply: string;
}

export default async function replyToReservation(req: Request, res: Response) {
    const { inquiryId, reply } = req.body as ReplyToReservationPayload;
    if (!inquiryId || inquiryId.trim() === "") {
        return res.status(400).json({ message: "잘못된 문의 ID입니다." });
    }
    if (!reply || reply.trim() === "") {
        return res.status(400).json({ message: "답변은 비워둘 수 없습니다." });
    }

    try {
        const inquiry = await prisma.reservation_log.findUnique({
            where: { id: inquiryId }
        });

        if (!inquiry) {
            return res.status(404).json({ message: "문의를 찾을 수 없습니다." });
        }

        await prisma.reservation_log.update({
            where: {
                id: inquiryId
            },
            data: {
                reply,
                updatedAt: new Date()
            }
        });

        return res.status(200).json({ message: "성공적으로 답변되었습니다." });
    } catch (error) {
        console.error("Error replying to reservation:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
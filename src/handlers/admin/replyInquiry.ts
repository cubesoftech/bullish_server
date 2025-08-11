import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ReplyInquiryPayload {
    inquiryId: string;
    reply: string;
}

export default async function replyInquiry(req: Request, res: Response) {
    const { inquiryId, reply } = req.body as ReplyInquiryPayload;

    if (!inquiryId || inquiryId.trim() === "" || !reply || reply.trim() === "") {
        return res.status(400).json({ message: "Inquiry ID and reply content are required" });
    }

    try {
        const inquiry = await prisma.inquiry_log.findUnique({
            where: {
                id: inquiryId,
                isReplied: false,
            },
        });
        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        await prisma.inquiry_log.update({
            where: { id: inquiryId },
            data: {
                reply,
                isReplied: true,
                updatedAt: new Date(),
            }
        });
        return res.status(200).json({ message: "Inquiry replied successfully" });
    } catch (error) {
        console.error("Error replying to inquiry: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
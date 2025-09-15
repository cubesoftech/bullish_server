import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ReplyToReservationPayload {
    inquiryId: string;
    reply: string;
}

export default async function replyToReservation(req: Request, res: Response) {
    const { inquiryId, reply } = req.body as ReplyToReservationPayload;
    if (!inquiryId || inquiryId.trim() === "") {
        return res.status(400).json({ message: "Invalid inquiry id." });
    }
    if (!reply || reply.trim() === "") {
        return res.status(400).json({ message: "Reply cannot be empty." });
    }

    try {
        const inquiry = await prisma.reservation_log.findUnique({
            where: { id: inquiryId }
        });

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found." });
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

        return res.status(200).json({ message: "Replied successfully." });
    } catch (error) {
        console.error("Error replying to reservation:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
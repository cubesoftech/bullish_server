import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface ReplyInquiryPayload {
    inquiryId: string;
    reply: string;
}

export default async function replyInquiry(req: Request, res: Response, next: NextFunction) {
    const { inquiryId, reply } = req.body as ReplyInquiryPayload;

    if (!inquiryId || inquiryId.trim() === "" || !reply || reply.trim() === "") {
        return next({
            status: 400,
            message: "Invalid inquiry id or reply."
        })
    }

    try {
        const inquiry = await prisma.inquiries.findUnique({
            where: {
                id: inquiryId
            }
        })
        if (!inquiry) {
            return next({
                status: 404,
                message: "Inquiry not found."
            })
        }

        await prisma.inquiries.update({
            where: {
                id: inquiry.id
            },
            data: {
                answer: reply,
                alreadyAnswered: true,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "Inquiry replied successfully." });
    } catch (error) {
        console.log("Error admin | replyInquiry: ", error);
        return next();
    }
}
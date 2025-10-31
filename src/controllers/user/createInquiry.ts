import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomString, getUserData } from "../../helpers";

interface CreateInquiryPayload {
    title: string;
    message: string;
}

export default async function createInquiry(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { title, message } = req.body as CreateInquiryPayload;

    if (!title || title.trim().length === 0 || !message || message.trim().length === 0) {
        return next({
            status: 400,
            message: "Invalid title or message."
        })
    }

    try {
        const member = await getUserData({
            userId: user.id,
            select: {
                id: true,
            }
        })

        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        await prisma.inquiries.create({
            data: {
                id: generateRandomString(7),
                content: message,
                title,
                answer: "",
                memberId: member.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({
            message: "Inquiry created successfully."
        })
    } catch (error) {
        console.log("Error user | createTransaction:", error);
        return next()
    }
}
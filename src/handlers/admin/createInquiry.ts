import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface CreateInquiryPayload {
    userId: string;
    content: string;
}

export default async function createInquiry(req: Request, res: Response) {
    const { userId, content } = req.body as CreateInquiryPayload;

    if (
        (!userId || userId.trim() === "")
        || (!content || content.trim() === "")
    ) {
        return res.status(400).json({ message: "User ID and content are required" });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.inquiry_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                content,
                reply: "",
                isReplied: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        return res.status(201).json({ message: "Inquiry created successfully" });
    } catch (error) {
        console.error("Error creating inquiry: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
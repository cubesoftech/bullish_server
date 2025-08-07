import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { generateRandomString } from "../../utils";

interface CreateNoticePayload {
    title: string;
    content: string;
}

export default async function createNotice(req: Request, res: Response) {
    const body = req.body as CreateNoticePayload;

    if (
        (!body.title || body.title.trim() === "") ||
        (!body.content || body.content.trim() === "")
    ) {
        return res.status(400).json({ error: "Title and content are required." });
    }

    try {
        await prisma.notices.create({
            data: {
                id: generateRandomString(7),
                ...body,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ message: "Notice created successfully." });
    } catch (error) {
        console.error("Error creating notice:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
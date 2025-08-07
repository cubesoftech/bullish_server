import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface UpdateNoticePayload {
    id: string;
    title: string;
    content: string;
}

export default async function updateNotice(req: Request, res: Response) {
    const body = req.body as UpdateNoticePayload;

    if (
        (!body.id || body.id.trim() === "") ||
        (!body.title || body.title.trim() === "") ||
        (!body.content || body.content.trim() === "")
    ) {
        return res.status(400).json({ error: "ID, title, and content are required." });
    }

    try {
        await prisma.notices.update({
            where: {
                id: body.id
            },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ message: "Notice updated successfully." });
    } catch (error) {
        console.error("Error creating notice:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomStringV2 } from "../../helpers";

interface CreateAnnouncementPayload {
    title: string;
    content: string;
}

export default async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
    const { title, content } = req.body as CreateAnnouncementPayload;

    if (!title || title.trim() === "" || !content || content.trim() === "") {
        return next({
            status: 400,
            message: "Invalid title or content."
        })
    }

    try {
        await prisma.announcement.create({
            data: {
                id: generateRandomStringV2(),
                title,
                content,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return res.status(201).json({ message: "Announcement created successfully." })
    } catch (error) {
        console.log("Error admin | createAnnouncement:", error);
        return next();
    }
}
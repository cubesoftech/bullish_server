import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateAnnouncementPayload {
    announcementId: string;
    newTitle: string;
    newContent: string;
}

export default async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
    const { announcementId, newTitle, newContent } = req.body as UpdateAnnouncementPayload;

    if (!announcementId || announcementId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid announcement id"
        });
    }
    if (!newTitle || newTitle.trim() === "" || !newContent || newContent.trim() === "") {
        return next({
            status: 400,
            message: "Invalid new title or content."
        });
    }

    try {
        const announcement = await prisma.announcement.findUnique({
            where: {
                id: announcementId
            }
        })
        if (!announcement) {
            return next({
                status: 404,
                message: "Announcement not found"
            })
        }

        await prisma.announcement.update({
            where: {
                id: announcement.id
            },
            data: {
                title: newTitle,
                content: newContent,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "Announcement updated successfully." });
    } catch (error) {
        console.log("Error admin | updateAnnouncement: ", error);
        return next();
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface DeleteAnnouncementPayload {
    announcementId: string
}

export default async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
    const { announcementId } = req.body as DeleteAnnouncementPayload
    if (!announcementId || announcementId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid announcement id"
        })
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

        await prisma.announcement.delete({
            where: {
                id: announcement.id
            }
        })

        return res.status(200).json({ message: "Delete announcement successfully" })
    } catch (error) {
        console.log("Error admin | deleteAnnouncement: ", error)
        return next()
    }
}
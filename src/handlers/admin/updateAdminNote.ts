import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateAdminNotePayload {
    note: string
}

export default async function updateAdminNote(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const { note } = req.body as UpdateAdminNotePayload

    if (!note || note.trim() === "") {
        return res.status(400).json({ message: "Note is required." })
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                id: user.id
            }
        })
        if (!admin) {
            return res.status(404).json({ message: "Admin not found." })
        }

        await prisma.admin.update({
            where: {
                id: admin.id
            },
            data: {
                note
            }
        })

        return res.status(200).json({ message: "Note updated successfully." })
    } catch (error) {
        console.error("Error on admin updateAdminNote: ", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
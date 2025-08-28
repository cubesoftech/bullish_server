import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateAdminSummaryPayload {
    summary: string
}

export default async function updateAdminSummary(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const { summary } = req.body as UpdateAdminSummaryPayload

    if (!summary || summary.trim() === "") {
        return res.status(400).json({ message: "Summary is required." })
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
                summary
            }
        })

        return res.status(200).json({ message: "Summary updated successfully." })
    } catch (error) {
        console.error("Error on admin updateAdminSummary: ", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
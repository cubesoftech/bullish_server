import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ReactivateUserAccountDeletionPayload {
    ids: string[]
}

export default async function reactivateUserAccountDeletion(req: Request, res: Response) {
    const { ids } = req.body as ReactivateUserAccountDeletionPayload
    if (!Array.isArray(ids) || ids.length <= 0 || ids.some(id => typeof id !== "string")) {
        return res.status(400).json({ message: "Invalid ids." })
    }

    try {
        await prisma.users.updateMany({
            where: {
                id: {
                    in: ids
                },
                isDeleted: true
            },
            data: {
                isDeleted: false,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "User account reactivated successfully." })
    } catch (error) {
        console.log("Error on admin reactivateUserAccountDeletion: ", error)
        return res.status(500).json({ message: "Internal server error." })
    }
}
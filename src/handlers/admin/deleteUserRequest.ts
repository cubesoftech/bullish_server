import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface DeleteUserRequestPayload {
    ids: string[];
}

export default async function deleteUserRequest(req: Request, res: Response) {
    const { ids } = req.body as DeleteUserRequestPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No user IDs provided" });
    }

    try {
        await prisma.users.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "Users deleted successfully" });
    } catch (error) {
        console.error("Error deleting users:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
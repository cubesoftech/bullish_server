import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface ApproveUserRequestPayload {
    ids: string[];
}

export default async function approveUserRequest(req: Request, res: Response) {
    const { ids } = req.body as ApproveUserRequestPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No user IDs provided" });
    }

    try {
        await prisma.users.updateMany({
            where: {
                id: {
                    in: ids
                }
            },
            data: {
                status: true
            }
        });
        return res.status(200).json({ message: "Users approved successfully" });
    } catch (error) {
        console.error("Error approving users:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
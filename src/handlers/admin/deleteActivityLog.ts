import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteActivityLogPayload {
    ids: string[];
}

export default async function deleteActivityLog(req: Request, res: Response) {
    const { ids } = req.body as DeleteActivityLogPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid ids." });
    }

    try {
        await prisma.activity_log.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "Activity logs deleted successfully." });
    } catch (error) {
        console.error("Error deleting activity logs: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
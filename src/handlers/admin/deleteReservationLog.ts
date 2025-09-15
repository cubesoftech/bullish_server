import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteReservationLogPayload {
    ids: string[];
}

export default async function deleteReservationLog(req: Request, res: Response) {
    const { ids } = req.body as DeleteReservationLogPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid request payload." });
    }

    try {
        await prisma.reservation_log.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
        return res.status(200).json({ message: "Notices deleted successfully." });
    } catch (error) {
        console.error("Error deleting notices: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
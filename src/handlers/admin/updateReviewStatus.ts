import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateReviewStatusPayload {
    id: string;
    status: string;
}

export default async function updateReviewStatus(req: Request, res: Response) {
    const { id, status } = req.body as UpdateReviewStatusPayload;

    const acceptedStatuses = ["COMPLETED", "PENDING", "FAILED"];
    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "Invalid or missing ID" });
    }

    if (!status || !acceptedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid or missing status" });
    }

    try {
        await prisma.review_log.update({
            where: {
                id,
            },
            data: {
                status: status as any,
            }
        });

        return res.status(200).json({ message: "Review status updated successfully" });
    } catch (error) {
        console.error("Error updating review status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
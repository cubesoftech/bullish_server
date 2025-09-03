import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateReferrerPointConversionPayload {
    id: string;
    status: string;
}

export default async function updateReferrerPointConversion(req: Request, res: Response) {
    const { id, status } = req.body as UpdateReferrerPointConversionPayload;

    const acceptedStatuses = ["COMPLETED", "PENDING", "FAILED"];
    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "Invalid or missing ID" });
    }

    if (!status || !acceptedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid or missing status" });
    }

    try {
        const log = await prisma.referrer_point_conversion_log.update({
            where: {
                id,
            },
            data: {
                status: status as any,
                updatedAt: new Date()
            }
        });

        if (status === "COMPLETED") {
            await prisma.users.update({
                where: {
                    id: log.userId
                },
                data: {
                    referrerPoints: {
                        decrement: log.amount
                    },
                    balance: {
                        increment: log.amount
                    },
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "Referrer point conversion log status updated successfully" });
    } catch (error) {
        console.error("Error updating referrer_point_conversion_log status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
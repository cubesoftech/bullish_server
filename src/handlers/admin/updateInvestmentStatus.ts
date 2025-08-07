import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateInvestmentPayload {
    seriesId: string;
    status: string;
}

export default async function updateInvestmentStatus(req: Request, res: Response) {
    const { seriesId, status } = req.body as UpdateInvestmentPayload;

    const acceptedStatus = ["COMPLETED", "FAILED"];

    if (
        (!seriesId || seriesId.trim() === "") ||
        !acceptedStatus.includes(status)
    ) {
        return res.status(400).json({ message: "Invalid investment and/or status." });
    }

    try {
        const series = await prisma.series_log.findFirst({
            where: {
                id: seriesId,
                status: "PENDING",
            }
        })
        if (!series) {
            return res.status(404).json({ message: "Investment not found or already processed" });
        }

        await prisma.series_log.update({
            where: {
                id: seriesId
            },
            data: {
                status: status as any,
                updatedAt: new Date(),
            }
        });
        // give back the amount to user if investment failed
        if (status === "FAILED") {
            await prisma.users.update({
                where: {
                    id: series.userId
                },
                data: {
                    balance: {
                        increment: series.amount
                    },
                    updatedAt: new Date(),
                }
            })
        }
        return res.status(200).json({ message: "Investment status updated successfully" });
    } catch (error) {
        console.error("Error updating investment status:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

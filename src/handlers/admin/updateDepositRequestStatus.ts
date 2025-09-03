import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateTransactionStatusPayload {
    id: string;
    status: string;
}

export default async function updateDepositRequestStatus(req: Request, res: Response) {
    const { id, status } = req.body as UpdateTransactionStatusPayload;

    const acceptedStatuses = ["COMPLETED", "PENDING", "FAILED"];
    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "Invalid or missing ID" });
    }

    if (!status || !acceptedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid or missing status" });
    }

    try {
        const request = await prisma.deposit_log.update({
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
                    id: request.userId
                },
                data: {
                    balance: {
                        increment: request.amount,
                    },
                    updatedAt: new Date()
                }
            })
        }

        return res.status(200).json({ message: "Deposit status updated successfully" });
    } catch (error) {
        console.error("Error updating deposit status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
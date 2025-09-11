import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";

interface UpdateWithdrawInvestedAmountPayload {
    requestId: string;
    status: string;
    approvedAmount: number;
}

export default async function updateWithdrawInvestedAmountStatus(req: Request, res: Response) {
    const { requestId, status, approvedAmount } = req.body as UpdateWithdrawInvestedAmountPayload;
    const acceptedStatuses: transaction_status[] = ["COMPLETED", "FAILED"];

    if (!requestId || requestId.trim() === "") {
        return res.status(400).json({ message: "Invalid requestId" })
    }

    if (!status || !acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "Invalid status" })
    }

    if (!approvedAmount || approvedAmount < 0 || isNaN(approvedAmount)) {
        return res.status(400).json({ message: "Invalid approvedAmount" })
    }

    try {
        const request = await prisma.investment_amount_withdrawal_log.findUnique({
            where: {
                id: requestId,
                status: "PENDING"
            }
        })
        if (!request) {
            return res.status(404).json({ message: "Request not found or already processed" })
        }

        await prisma.investment_amount_withdrawal_log.update({
            where: {
                id: request.id
            },
            data: {
                status: status as transaction_status,
                approvedAmount,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Request updated successfully" })
    } catch (error) {
        console.error("Error admin updateWithdrawInvestedAmountStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
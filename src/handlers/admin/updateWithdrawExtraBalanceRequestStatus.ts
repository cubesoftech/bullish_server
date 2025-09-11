import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";

interface UpdateWithdrawExtraBalanceRequestStatusPayload {
    requestId: string;
    status: string;
    approvedAmount: number;
}

export default async function updateWithdrawExtraBalanceRequestStatus(req: Request, res: Response) {
    const { requestId, status, approvedAmount } = req.body as UpdateWithdrawExtraBalanceRequestStatusPayload;
    const acceptedStatuses: transaction_status[] = ["COMPLETED", "FAILED"];
    if (!requestId || requestId.trim() === "") {
        return res.status(400).json({ message: "Request ID is required" });
    }
    if (!status || !acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    if (!approvedAmount || approvedAmount <= 0 || isNaN(approvedAmount)) {
        return res.status(400).json({ message: "Invalid approved amount" });
    }

    try {
        const request = await prisma.withdraw_extra_balance_log.findUnique({
            where: {
                id: requestId,
                status: "PENDING"
            }
        })
        if (!request) {
            return res.status(404).json({ message: "Pending request not found" });
        }

        if (approvedAmount > request.amount) {
            return res.status(400).json({ message: "Approved amount cannot be greater than requested amount" });
        }

        await prisma.withdraw_extra_balance_log.update({
            where: {
                id: requestId
            },
            data: {
                status: status as transaction_status,
                approvedAmount: approvedAmount,
                updatedAt: new Date()
            }
        });

        if (approvedAmount < request.amount) {
            const refundAmount = request.amount - approvedAmount;
            await prisma.users.update({
                where: {
                    id: request.userId
                },
                data: {
                    extraWithdrawalBalance: {
                        increment: refundAmount
                    }
                }
            });
        }

        if (status === "FAILED") {
            await prisma.users.update({
                where: {
                    id: request.userId
                },
                data: {
                    extraWithdrawalBalance: {
                        increment: request.amount
                    }
                }
            })
        }

        return res.status(200).json({ message: "Request status updated successfully" });
    } catch (error) {
        console.error("Error updateWithdrawExtraBalanceRequestStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
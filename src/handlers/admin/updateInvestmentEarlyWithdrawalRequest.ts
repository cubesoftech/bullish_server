import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";
import { generateRandomString } from "../../utils";

interface UpdateInvestmentEarlyWithdrawalRequestPayload {
    requestId: string;
    status: string;
}

export default async function updateInvestmentEarlyWithdrawalRequest(req: Request, res: Response) {
    const { requestId, status } = req.body as UpdateInvestmentEarlyWithdrawalRequestPayload;
    const acceptedStatuses: transaction_status[] = ["COMPLETED", "FAILED"];

    if (!requestId || requestId.trim() === "") {
        return res.status(400).json({ message: "Invalid request ID" });
    }
    if (!status || !acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const request = await prisma.investment_early_withdrawal_log.findUnique({
            where: {
                id: requestId,
                status: "PENDING"
            }
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        await prisma.investment_early_withdrawal_log.update({
            where: {
                id: requestId,
            },
            data: {
                status: status as transaction_status,
                updatedAt: new Date(),
            }
        });
        if (status === "COMPLETED") {
            await prisma.early_withdrawned_investment_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: request.userId,
                    investmentLogId: request.investmentLogId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "Request updated successfully" });
    } catch (error) {
        console.error("Error updateInvestmentEarlyWithdrawalRequest:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
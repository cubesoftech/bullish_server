import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";
import { generateRandomString } from "../../utils";

interface UpdateInvestmentLogStatusPayload {
    investmentLogId: string;
    status: string;
    note: string;
    amount: number;
    action: boolean; //true for add profit log, false for update investment log only
    settlementRate: number;
}

export default async function updateInvestmentLogStatus(req: Request, res: Response) {
    const { investmentLogId, status, note, amount, action, settlementRate } = req.body as UpdateInvestmentLogStatusPayload;

    if (!investmentLogId || investmentLogId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment log ID" });
    }

    if (!status || status.trim() === "") {
        return res.status(400).json({ message: "Status is required" });
    }

    const acceptedStatuses: transaction_status[] = ["PENDING", "COMPLETED", "FAILED"];
    if (!acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentLogId,
                status: "PENDING"
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "Investment log not found or not in PENDING status" });
        }

        if (action) {
            if (!amount || amount <= 0) {
                return res.status(400).json({ message: "Amount must be greater than zero when marking as paid" });
            }
            if (!settlementRate || settlementRate <= 0) {
                return res.status(400).json({ message: "Settlement rate must be greater than zero when marking as paid" });
            }

            await prisma.$transaction(async (tx) => {
                await tx.profit_log.create({
                    data: {
                        id: generateRandomString(7),
                        userId: investment.userId,
                        investmentLogId: investment.id,
                        seriesId: investment.seriesId,
                        profit: amount,
                        settlementRate: settlementRate / 100,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                await tx.investment_log.update({
                    where: {
                        id: investment.id
                    },
                    data: {
                        totalProfit: {
                            increment: amount
                        },
                        updatedAt: new Date()
                    }
                })
            })
        }

        await prisma.investment_log.update({
            where: {
                id: investmentLogId
            },
            data: {
                status: status as transaction_status,
                note: note || "",
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Investment log status updated successfully" });
    } catch (error) {
        console.log("Error updateInvestmentLogStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
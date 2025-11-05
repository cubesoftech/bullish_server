import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { transaction_status, transaction_type } from "@prisma/client";

interface UpdateTransactionPayload {
    transactionId: string;
    newStatus: string;
    type: string;
}

export default async function updateTransaction(req: Request, res: Response, next: NextFunction) {
    const { transactionId, newStatus, type } = req.body as UpdateTransactionPayload;
    const acceptedStatuses: transaction_status[] = ["completed", "failed", "pending"]
    const acceptedType: transaction_type[] = ["deposit", "withdrawal"]

    if (!transactionId || transactionId.trim() === "" || !newStatus || newStatus.trim() === "") {
        return next({
            status: 400,
            message: "Invalid transactionId or newStatus."
        })
    }
    if (!acceptedStatuses.includes(newStatus as transaction_status)) {
        return next({
            status: 400,
            message: "newStatus must be either 'completed' or 'failed'."
        })
    }
    if (!acceptedType.includes(type as transaction_type)) {
        return next({
            status: 400,
            message: "Invalid transaction type"
        })
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: transactionId
            }
        })
        if (!transaction) {
            return next({
                status: 404,
                message: "Transaction not found."
            })
        }

        await prisma.transaction.update({
            where: {
                id: transaction.id
            },
            data: {
                status: newStatus as transaction_status,
                updatedAt: new Date(),
            }
        })

        if (
            (type === "withdrawal" && newStatus === "failed")
            || (type === "deposit" && newStatus === "completed")
        ) {
            await prisma.members.update({
                where: {
                    id: transaction.membersId
                },
                data: {
                    balance: {
                        increment: transaction.amount
                    },
                }
            })
        }

        return res.status(200).json({ message: "Transaction updated successfully." });
    } catch (error) {
        console.log("Error admin | updateTransaction:", error);
        return next();
    }
}
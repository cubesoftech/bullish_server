import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { agents_withdrawals_status, Prisma } from "@prisma/client";


interface UpdateWithdrawalStatusPayload {
    id: string;
    status: string;
}

export default async function updateWithdrawalStatus(req: Request, res: Response, next: NextFunction) {
    const { id, status } = req.body as UpdateWithdrawalStatusPayload;
    const acceptedStatuses: agents_withdrawals_status[] = ["completed", "failed"]

    if (!id || id.trim() === "" || !status || status.trim() === "") {
        return next({
            status: 400,
            message: "Invalid id or status."
        })
    }
    if (!acceptedStatuses.includes(status as agents_withdrawals_status)) {
        return next({
            status: 400,
            message: "Status must be either 'completed' or 'failed'."
        })
    }

    try {
        const transaction = await prisma.agents_withdrawals.findUnique({
            where: {
                id,
                status: "pending"
            }
        })
        if (!transaction) {
            return next({
                status: 404,
                message: "Transaction not found."
            })
        }

        await prisma.agents_withdrawals.update({
            where: {
                id: transaction.id
            },
            data: {
                status: status as agents_withdrawals_status
            }
        })

        return res.status(200).json({
            message: "Withdrawal status updated successfully."
        })
    } catch (error) {
        console.log("Error admin | updateWithdrawalStatus:", error);
        return next();
    }
}
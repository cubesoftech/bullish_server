import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface DeleteTransactionsPayload {
    transactionIds: string[]
}

export default async function deleteTransactions(req: Request, res: Response, next: NextFunction) {
    const { transactionIds } = req.body as DeleteTransactionsPayload

    if (!Array.isArray(transactionIds) || transactionIds.some(t => typeof t !== "string")) {
        return next({
            status: 400,
            message: "Invalid trade ids."
        })
    }

    try {
        await prisma.transaction.deleteMany({
            where: {
                id: {
                    in: transactionIds
                }
            }
        })

        return res.status(200).json({ message: "Transactions deleted successfully." })
    } catch (error) {
        console.log("Error admin | deleteTransactions: ", error)
        return next();
    }
}
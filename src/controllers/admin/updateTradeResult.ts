import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateTradeResultPayload {
    tradeId: string;
    result: boolean;
}

export default async function updateTradeResult(req: Request, res: Response, next: NextFunction) {
    const { tradeId, result } = req.body as UpdateTradeResultPayload;

    if (!tradeId || tradeId.trim() === "" || result === undefined) {
        return next({
            status: 400,
            message: "Invalid tradeId or result."
        });
    }

    try {
        const trade = await prisma.recenttrades.findUnique({
            where: {
                id: tradeId
            }
        })
        if (!trade) {
            return next({
                status: 404,
                message: "Trade not found."
            })
        }

        await prisma.recenttrades.update({
            where: {
                id: trade.id
            },
            data: {
                result
            }
        })

        return res.status(200).json({ message: "Trade result updated successfully." })
    } catch (error) {
        console.log("Error admin | updateTradeResult:", error);
        return next();
    }
}
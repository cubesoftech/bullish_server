import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface GetUserTradesPayload {
    userId: string
}

export default async function getUserTrades(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.body as GetUserTradesPayload;

    if (!userId || userId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid user id."
        });
    }

    try {
        const user = await prisma.members.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        return res.status(200).json({
            data: {
                nasdaq: user.nasdaq_trade,
                gold: user.gold_trade,
                eurusd: user.eurusd_trade,
                pltr: user.pltr_trade,
                tsla: user.tsla_trade,
                nvda: user.nvda_trade,
            }
        })
    } catch (error) {
        console.log("Error admin | getUserTrades: ", error);
        return next();
    }
}
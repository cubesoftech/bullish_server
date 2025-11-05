import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface SwitchTradePayload {
    tradeId: string;
    value: boolean
}

export default async function switchTrade(req: Request, res: Response, next: NextFunction) {
    const { tradeId, value } = req.body as SwitchTradePayload;

    if (!tradeId || tradeId.trim() === "" || value === undefined) {
        return next({
            status: 400,
            message: "Invalid tradeId or status."
        });
    }

    try {
        const trade = await prisma.membertrades.findFirst({
            where: {
                id: tradeId,
                tradePNL: 0
            }
        })
        if (!trade) {
            return next({
                status: 404,
                message: "Trade not found."
            })
        }

        const willDuplicate = await prisma.membertrades.findFirst({
            where: {
                id: tradeId,
                tradePNL: 0,
                trade: !value
            }
        })
        if (willDuplicate) {
            return next({
                status: 400,
                message: "Trade already exists."
            })
        }

        await prisma.membertrades.update({
            where: {
                id: tradeId
            },
            data: {
                trade: value
            }
        })

        return res.status(200).json({ message: "Trade updated." })
    } catch (error) {
        console.log("Error admin | switchTrade:", error);
        return next();
    }
}
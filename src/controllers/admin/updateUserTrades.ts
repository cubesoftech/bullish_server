import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_nasdaq_trade } from "@prisma/client";

interface UpdateUserTradesPayload {
    userId: string;
    nasdaq: string;
    gold: string;
    eurusd: string;
    nvda: string;
    pltr: string;
    tsla: string;
}

export default async function updateUserTrades(req: Request, res: Response, next: NextFunction) {
    const { userId, nasdaq, gold, eurusd, nvda, pltr, tsla } = req.body as UpdateUserTradesPayload;
    const acceptedTrades: members_nasdaq_trade[] = ["nasdaq", "gold", "eurusd", "nvda", "pltr", "tsla"];

    if (
        !userId || userId.trim() === "" ||
        !nasdaq || nasdaq.trim() === "" ||
        !gold || gold.trim() === "" ||
        !eurusd || eurusd.trim() === "" ||
        !nvda || nvda.trim() === "" ||
        !pltr || pltr.trim() === "" ||
        !tsla || tsla.trim() === ""
    ) {
        return next({
            status: 400,
            message: "Invalid userId or trade values."
        });
    }


    if (!acceptedTrades.includes(nasdaq as members_nasdaq_trade) ||
        !acceptedTrades.includes(gold as members_nasdaq_trade) ||
        !acceptedTrades.includes(eurusd as members_nasdaq_trade) ||
        !acceptedTrades.includes(nvda as members_nasdaq_trade) ||
        !acceptedTrades.includes(pltr as members_nasdaq_trade) ||
        !acceptedTrades.includes(tsla as members_nasdaq_trade)
    ) {
        return next({
            status: 400,
            message: "One or more trade values are invalid."
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

        await prisma.members.update({
            where: {
                id: user.id
            },
            data: {
                nasdaq_trade: nasdaq as members_nasdaq_trade,
                gold_trade: gold as members_nasdaq_trade,
                eurusd_trade: eurusd as members_nasdaq_trade,
                nvda_trade: nvda as members_nasdaq_trade,
                pltr_trade: pltr as members_nasdaq_trade,
                tsla_trade: tsla as members_nasdaq_trade,
            }
        })

        return res.status(200).json({ message: "User trades updated" })
    } catch (error) {
        console.log("Error admin | updateUserTrades:", error);
        return next();
    }
}
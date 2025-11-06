import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomString, getUserData } from "../../helpers";
import { membertrades_type } from "@prisma/client";
import { executeTradesV2QueueUpsertJobScheduler } from "../../jobs/executeTradesV2";

interface ExecuteTradePayload {
    type: membertrades_type;
    tradeAmount: number;
    trade: boolean;
}

export default async function executeTrade(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    let { trade, tradeAmount, type } = req.body as ExecuteTradePayload;

    if (!tradeAmount || tradeAmount <= 0) {
        return next({
            status: 400,
            message: "Trade amount should be greater than 0."
        })
    }

    try {
        const member = await getUserData({
            userId: user.id,
            select: {
                id: true,
                balance: true,
                maxBet: true,
                switchBet: true,
            }
        })

        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        trade = member.switchBet ? !trade : trade;

        if (!member.balance || member.balance < 0) {
            return next({
                status: 400,
                message: "Insufficient balance."
            })
        }

        let multiplier = 1;

        const memberInjectSetting = await prisma.inject_setting.findFirst({
            where: {
                userId: member.id,
                status: true,
            }
        })

        if (memberInjectSetting) {
            multiplier = memberInjectSetting.multiplier
        }

        tradeAmount = tradeAmount * multiplier;

        const hasPendingTrade = await prisma.membertrades.findFirst({
            where: {
                id: member.id,
                trade,
                type,
                tradePNL: 0
            }
        })
        if (hasPendingTrade) {
            return next({
                status: 400,
                message: "You cannot have two trade at a time."
            })
        }

        if (tradeAmount > (member.balance || 0)) {
            tradeAmount = member.balance || 0;
        }

        const tradeRecord = await prisma.membertrades.create({
            data: {
                id: generateRandomString(7),
                trade,
                tradeAmount,
                type,
                timeExecuted: new Date(),
                tradePNL: 0,
                membersId: member.id,
            }
        })

        await executeTradesV2QueueUpsertJobScheduler(tradeRecord);

        await prisma.members.update({
            where: {
                id: member.id
            },
            data: {
                balance: (member.balance || 0) - tradeAmount
            }
        })

        return res.status(200).json({ message: "Trade executed successfully" })
    } catch (error) {
        console.log("Error user | executeTrade:", error);
        return next()
    }
}
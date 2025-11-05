import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface MaxbetTradePayload {
    tradeId: string;
    memberId: string;
    status: boolean;
}

export default async function updateTradeMaxbet(req: Request, res: Response, next: NextFunction) {
    const { tradeId, memberId, status } = req.body as MaxbetTradePayload;

    if (!tradeId || tradeId.trim() === "" || !memberId || memberId.trim() === "" || status === undefined) {
        return next({
            status: 400,
            message: "Invalid tradeId, memberId or status."
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
            return res.status(404).json({ message: "Trade not found." })
        }

        const member = await prisma.members.findFirst({
            where: {
                id: memberId
            }
        })

        if (!member) {
            return res.status(404).json({ message: "User not found." })
        }

        let balance = member?.balance || 0

        if (balance < 0) balance = 0

        const gameSetting = await prisma.sitesettings.findFirst()

        if (!gameSetting) {
            return next({
                status: 400,
                message: "Game settings not found."
            })
        }

        let lowestBet = gameSetting.minimumAmount || 0

        if (status && balance <= lowestBet) {
            return next({
                status: 400,
                message: "Not enough asset."
            })
        }

        await prisma.$transaction(async (tx) => {
            await tx.membertrades.update({
                where: {
                    id: trade.id
                },
                data: {
                    tradeAmount: status ? (balance + trade.tradeAmount) : balance
                }
            })
            await tx.members.update({
                where: {
                    id: member.id
                },
                data: {
                    balance: status ? 0 : balance
                }
            })
        })

        return res.status(200).json({ message: "Trade updated successfully." })
    } catch (error) {
        console.log("Error admin | updateTradeMaxbet:", error);
        return next()
    }
}
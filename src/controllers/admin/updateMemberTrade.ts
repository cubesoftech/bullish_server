import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";

interface UpdateMemberTradePayload {
    tradeID: string;
    membersId: string;
    newAmount: number
}

export default async function updateMemberTrade(req: Request, res: Response, next: NextFunction) {
    const { tradeID, membersId, newAmount } = req.body as UpdateMemberTradePayload;

    if (!tradeID || tradeID.trim() === "" || !membersId || membersId.trim() === "" || newAmount === undefined || newAmount < 0) {
        return next({
            status: 400,
            message: "Invalid tradeID, membersId, or newAmount."
        });
    }

    try {
        const siteSettings = await prisma.sitesettings.findFirst();
        if (!siteSettings) {
            return next({
                status: 400,
                message: "Site settings not found."
            })
        }

        if (siteSettings.minimumAmount > newAmount) {
            return next({
                status: 400,
                message: `New amount must be at least ${siteSettings.minimumAmount}.`
            })
        }

        const memberTrade = await prisma.membertrades.findFirst({
            where: {
                id: tradeID,
                membersId: membersId,
                tradePNL: 0
            }
        })
        if (!memberTrade) {
            return next({
                status: 404,
                message: "Trade not found."
            })
        }

        await prisma.$transaction(async (tx) => {
            await tx.membertrades.update({
                where: {
                    id: memberTrade.id
                },
                data: {
                    tradeAmount: newAmount
                }
            });
            await tx.members.update({
                where: {
                    id: memberTrade.membersId
                },
                data: {
                    balance: newAmount < memberTrade.tradeAmount
                        ? {
                            increment: newAmount
                        }
                        : {
                            decrement: newAmount
                        }
                }
            })
        })

        return res.status(200).json({ message: "Trade updated" })

    } catch (error) {
        console.log("Error admin | updateMemberTrade:", error);
        return next();
    }

}
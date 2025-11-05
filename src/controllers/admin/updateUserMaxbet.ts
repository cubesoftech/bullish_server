import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateUserMaxbetPayload {
    userId: string;
    value: boolean
}

export default async function updateUserMaxbet(req: Request, res: Response, next: NextFunction) {
    const { userId, value } = req.body as UpdateUserMaxbetPayload;

    if (!userId || userId.trim() === "" || value === undefined) {
        return next({
            status: 400,
            message: "Invalid userId or value."
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
                maxBet: value
            }
        })

        const pendingTrades = await prisma.membertrades.findMany({
            where: {
                membersId: user.id,
                tradePNL: 0
            }
        })

        if (pendingTrades.length > 0) {
            await Promise.all(
                pendingTrades.map(async trade => {
                    const { id, membersId, tradeAmount } = trade

                    // check if there are othher trades
                    const otherTrades = await prisma.membertrades.findMany({
                        where: {
                            membersId,
                            tradePNL: 0
                        }
                    })

                    // get the info of trader
                    const member = await prisma.members.findFirst({
                        where: {
                            id: membersId
                        }
                    })

                    let balance = member?.balance || 0

                    if (trade && balance >= 0) {
                        await prisma.$transaction(async (tx) => {
                            await tx.membertrades.update({
                                where: {
                                    id
                                },
                                data: {
                                    tradeAmount: value
                                        ? balance / otherTrades.length
                                        : balance
                                }
                            })

                            await tx.members.update({
                                where: {
                                    id: membersId
                                },
                                data: {
                                    balance: value ? 0 : balance
                                }
                            })
                        })
                    }
                })
            )
        }

        return res.status(200).json({ message: "User max bet updated successfully." })
    } catch (error) {
        console.log("Error admin | updateUserMaxbet:", error);
        return next()
    }
}
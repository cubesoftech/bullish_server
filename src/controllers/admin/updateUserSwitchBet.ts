import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateUserSwitchBetPayload {
    userId: string;
    status: boolean
}

export default async function updateUserSwitchBet(req: Request, res: Response, next: NextFunction) {
    const { userId, status } = req.body as UpdateUserSwitchBetPayload;

    if (!userId || userId.trim() === "" || status === undefined) {
        return next({
            status: 400,
            message: "Invalid userId or status."
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
                switchBet: status
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
                pendingTrades.map(async pendingTrade => {
                    const { id, trade } = pendingTrade

                    await prisma.membertrades.update({
                        where: {
                            id
                        },
                        data: {
                            trade: !trade
                        }
                    })
                })
            )
        }

        return res.status(200).json({ message: "User switched bet successfully" })
    } catch (error) {
        console.log("Error admin | updateUserSwitchBet:", error);
        return next()
    }
}
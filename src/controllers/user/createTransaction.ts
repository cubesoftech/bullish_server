import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { transaction_type } from "@prisma/client";
import { generateRandomString, getUserData } from "../../helpers";

interface CreateTransactionPayload {
    type: transaction_type;
    amount: number;
}

export default async function createTransaction(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { type, amount } = req.body as CreateTransactionPayload;

    if (!amount || amount <= 0) {
        return next({
            status: 400,
            message: "Invalid amount."
        })
    }

    try {
        const member = await getUserData({
            userId: user.id,
            select: {
                id: true,
                email: true,
                balance: true,
            }
        })

        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        const alreadyhavePenidngTransaction = await prisma.transaction.findFirst({
            where: {
                membersId: member.id,
                status: "pending",
                type,
            },
        });
        if (alreadyhavePenidngTransaction) {
            return next({
                status: 400,
                message: "Already have pending transaction."
            })
        }

        const isTester = member.email.includes("test")

        if (type === "withdrawal" && (member.balance || 0) < amount) {
            return next({
                status: 400,
                message: "Insufficient balance."
            })
        }

        if (!isTester) {
            await prisma.transaction.create({
                data: {
                    id: generateRandomString(7),
                    amount,
                    membersId: member.id,
                    description: `${type === "deposit" ? "Deposit" : "Withdraw"}`,
                    status: "failed",
                    type,
                    updatedAt: new Date(),
                },
            });
        } else {
            await prisma.transaction.create({
                data: {
                    amount,
                    membersId: member.id,
                    description: `${type === "deposit" ? "Deposit" : "Withdraw"}`,
                    status: "completed",
                    type,
                    id: generateRandomString(7),
                    updatedAt: new Date(),
                },
            });

            if (type === "deposit") {
                await prisma.members.update({
                    data: {
                        balance: {
                            increment: amount,
                        },
                    },
                    where: {
                        id: member.id,
                    },
                });
            } else {
                await prisma.members.update({
                    data: {
                        balance: {
                            decrement: amount,
                        },
                    },
                    where: {
                        id: member.id,
                    },
                });
            }
        }

        if (type === "withdrawal") {
            await prisma.members.update({
                where: {
                    id: member.id,
                },
                data: {
                    balance: {
                        decrement: amount,
                    },
                },
            });
        }

        return res.status(200).json({
            message: "Deposit successful"
        })
    } catch (error) {
        console.log("Error user | createTransaction:", error);
        return next()
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface WithdrawExtraBalancePayload {
    amount: number;
}

export default async function withdrawExtraBalance(req: Request, res: Response) {
    const { user } = req;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { amount } = req.body as WithdrawExtraBalancePayload;
    if (!amount || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id
            },
            select: {
                id: true,
                extraWithdrawalBalance: true
            }
        });
        if (!userInfo) return res.status(404).json({ message: "User not found" });

        if (userInfo.extraWithdrawalBalance < amount) {
            return res.status(400).json({ message: "Insufficient extra withdrawal balance" });
        }

        await prisma.users.update({
            where: {
                id: userInfo.id
            },
            data: {
                extraWithdrawalBalance: {
                    decrement: amount
                }
            }
        });
        await prisma.withdraw_extra_balance_log.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                amount: amount,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Withdrawal successful", newBalance: userInfo.extraWithdrawalBalance - amount });
    } catch (error) {
        console.error("Error withdrawExtraBalance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateUserExtraWithdrawableBalancePayload {
    userId: string;
    amount: number;
    type: "ADD" | "SUBTRACT";
}

export default async function updateUserExtraWithdrawableBalance(req: Request, res: Response) {
    const { userId, amount, type } = req.body as UpdateUserExtraWithdrawableBalancePayload;

    if (!userId || userId.trim() === "") {
        return res.status(400).json({ message: "User ID is required" });
    }
    if (!amount || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid amount" });
    }
    if (!type || (type !== "ADD" && type !== "SUBTRACT")) {
        return res.status(400).json({ message: "Invalid type" });
    }

    try {
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (type === "SUBTRACT" && user.extraWithdrawalBalance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        await prisma.users.update({
            where: {
                id: userId
            },
            data: {
                extraWithdrawalBalance: type === "ADD"
                    ? {
                        increment: amount
                    }
                    : {
                        decrement: amount
                    }
            }
        });

        return res.status(200).json({ message: "User extra withdrawable balance updated successfully" });
    } catch (error) {
        console.error("Error updating user extra withdrawable balance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
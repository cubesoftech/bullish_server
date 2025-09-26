import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface WithdrawExtraBalancePayload {
    amount: number;
}

export default async function withdrawExtraBalance(req: Request, res: Response) {
    const { user } = req;
    if (!user) return res.status(401).json({ message: "인증되지 않았습니다." });

    const { amount } = req.body as WithdrawExtraBalancePayload;
    if (!amount || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "잘못된 금액입니다." });
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
        if (!userInfo) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        if (userInfo.extraWithdrawalBalance < amount) {
            return res.status(400).json({ message: "추가 출금 가능 잔액이 부족합니다" });
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

        return res.status(200).json({ message: "출금이 완료되었습니다", newBalance: userInfo.extraWithdrawalBalance - amount });
    } catch (error) {
        console.error("Error withdrawExtraBalance:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
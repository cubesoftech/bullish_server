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
        return res.status(400).json({ message: "사용자 ID는 필수입니다." });
    }
    if (!amount || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "잘못된 금액입니다." });
    }
    if (!type || (type !== "ADD" && type !== "SUBTRACT")) {
        return res.status(400).json({ message: "잘못된 유형" });
    }

    try {
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if (type === "SUBTRACT" && user.extraWithdrawalBalance < amount) {
            return res.status(400).json({ message: "잔액 부족" });
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

        return res.status(200).json({ message: "사용자 추가 출금 가능 잔액이 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating user extra withdrawable balance:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
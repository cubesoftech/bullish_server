import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface WithdrawInvestedAmountPayload {
    investmentId: string;
}

export default async function withdrawInvestedAmount(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." })
    }
    const { id } = user
    const { investmentId } = req.body as WithdrawInvestedAmountPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 ID" })
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id,
                status: true,
                isDeleted: false
            }
        })

        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                userId: userInfo.id,
                status: "COMPLETED"
            }
        })

        if (!investment) {
            return res.status(404).json({ message: "투자를 찾을 수 없습니다" })
        }

        const hasExistingRequest = await prisma.investment_amount_withdrawal_log.findFirst({
            where: {
                investmentLogId: investment.id,
                status: "PENDING"
            }
        })

        if (hasExistingRequest) {
            return res.status(400).json({ message: "투자를 찾을 수 없습니다.이 투자에 대해 이미 대기 중인 출금 요청이 있습니다." })
        }

        await prisma.investment_amount_withdrawal_log.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                investmentLogId: investment.id,
                amount: investment.amount,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        await notifyAdmin();

        return res.status(200).json({ message: "출금 요청이 성공적으로 제출되었습니다." })
    } catch (error) {
        console.error("Error withdrawInvestedAmount:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
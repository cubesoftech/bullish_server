import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface RequestInvestmentEarlyWithdrawalPayload {
    investmentId: string;
}

export default async function requestInvestmentEarlyWithdrawal(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    const { investmentId } = req.body as RequestInvestmentEarlyWithdrawalPayload;
    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 ID입니다." });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id,
                status: true,
                isDeleted: false,
            },
        });
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                status: "PENDING",
                userId: user.id
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "투자를 찾을 수 없거나 조기 출금이 불가능합니다." });
        }

        const existingRequest = await prisma.investment_early_withdrawal_log.findFirst({
            where: {
                investmentLogId: investment.id,
                userId: user.id,
                status: "PENDING"
            }
        })
        if (existingRequest) {
            return res.status(400).json({ message: "이 투자에 대해 이미 조기 출금 요청이 존재합니다." });
        }

        await prisma.investment_early_withdrawal_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                investmentLogId: investment.id,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        await notifyAdmin();
        return res.status(200).json({ message: "조기 출금 요청이 성공적으로 제출되었습니다." });
    } catch (error) {
        console.error("Error requestInvestmentEarlyWithdrawal:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }

}
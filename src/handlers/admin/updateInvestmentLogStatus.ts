import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";
import { generateRandomString } from "../../utils";

interface UpdateInvestmentLogStatusPayload {
    investmentLogId: string;
    status: string;
    note: string;
    amount: number;
    action: boolean; //true for add profit log, false for update investment log only
    settlementRate: number;
}

export default async function updateInvestmentLogStatus(req: Request, res: Response) {
    const { investmentLogId, status, note, amount, action, settlementRate } = req.body as UpdateInvestmentLogStatusPayload;

    if (!investmentLogId || investmentLogId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 로그 ID입니다." });
    }

    if (!status || status.trim() === "") {
        return res.status(400).json({ message: "상태는 필수입니다." });
    }

    const acceptedStatuses: transaction_status[] = ["PENDING", "COMPLETED", "FAILED"];
    if (!acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "잘못된 상태입니다." });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentLogId,
                status: "PENDING"
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "투자 로그를 찾을 수 없거나 대기 상태가 아닙니다." });
        }

        if (action) {
            if (!amount || amount <= 0) {
                return res.status(400).json({ message: "지급 처리 시 금액은 0보다 커야 합니다." });
            }
            if (!settlementRate || settlementRate <= 0) {
                return res.status(400).json({ message: "지급 처리 시 정산율은 0보다 커야 합니다." });
            }

            await prisma.$transaction(async (tx) => {
                await tx.profit_log.create({
                    data: {
                        id: generateRandomString(7),
                        userId: investment.userId,
                        investmentLogId: investment.id,
                        seriesId: investment.seriesId,
                        profit: amount,
                        settlementRate: settlementRate / 100,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                await tx.investment_log.update({
                    where: {
                        id: investment.id
                    },
                    data: {
                        totalProfit: {
                            increment: amount
                        },
                        updatedAt: new Date()
                    }
                })
            })
        }

        await prisma.investment_log.update({
            where: {
                id: investmentLogId
            },
            data: {
                status: status as transaction_status,
                note: note || "",
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "투자 로그 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.log("Error updateInvestmentLogStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
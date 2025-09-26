import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";

interface UpdateWithdrawExtraBalanceRequestStatusPayload {
    requestId: string;
    status: string;
    approvedAmount: number;
}

export default async function updateWithdrawExtraBalanceRequestStatus(req: Request, res: Response) {
    const { requestId, status, approvedAmount } = req.body as UpdateWithdrawExtraBalanceRequestStatusPayload;
    const acceptedStatuses: transaction_status[] = ["COMPLETED", "FAILED"];
    if (!requestId || requestId.trim() === "") {
        return res.status(400).json({ message: "요청 ID는 필수입니다." });
    }
    if (!status || !acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "잘못된 상태입니다." });
    }
    if (!approvedAmount || approvedAmount <= 0 || isNaN(approvedAmount)) {
        return res.status(400).json({ message: "잘못된 승인 금액입니다." });
    }

    try {
        const request = await prisma.withdraw_extra_balance_log.findUnique({
            where: {
                id: requestId,
                status: "PENDING"
            }
        })
        if (!request) {
            return res.status(404).json({ message: "대기 중인 요청을 찾을 수 없습니다." });
        }

        if (approvedAmount > request.amount) {
            return res.status(400).json({ message: "승인 금액은 요청 금액보다 클 수 없습니다." });
        }

        await prisma.withdraw_extra_balance_log.update({
            where: {
                id: requestId
            },
            data: {
                status: status as transaction_status,
                approvedAmount: approvedAmount,
                updatedAt: new Date()
            }
        });

        if (approvedAmount < request.amount) {
            const refundAmount = request.amount - approvedAmount;
            await prisma.users.update({
                where: {
                    id: request.userId
                },
                data: {
                    extraWithdrawalBalance: {
                        increment: refundAmount
                    }
                }
            });
        }

        if (status === "FAILED") {
            await prisma.users.update({
                where: {
                    id: request.userId
                },
                data: {
                    extraWithdrawalBalance: {
                        increment: request.amount
                    }
                }
            })
        }

        return res.status(200).json({ message: "요청 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updateWithdrawExtraBalanceRequestStatus:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
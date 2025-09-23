import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";
import { stat } from "fs";
import { getInvestmentAdditionalData } from "../../utils";

interface UpdateExtendInvestmentDurationStatusPayload {
    requestId: string;
    status: string;
}

export default async function updateExtendInvestmentDurationStatus(req: Request, res: Response) {
    const { requestId, status } = req.body as UpdateExtendInvestmentDurationStatusPayload;

    if (!requestId || requestId.trim() === "") {
        return res.status(400).json({ message: "잘못된 요청 ID입니다." });
    }
    if (!status || status.trim() === "") {
        return res.status(400).json({ message: "상태는 필수입니다." });
    }

    const acceptedStatuses: transaction_status[] = ["PENDING", "COMPLETED", "FAILED"];
    if (!acceptedStatuses.includes(status as transaction_status)) {
        return res.status(400).json({ message: "잘못된 상태입니다." });
    }

    try {
        const request = await prisma.extend_investment_duration_log.findUnique({
            where: {
                id: requestId,
                status: "PENDING"
            }
        })
        if (!request) {
            return res.status(404).json({ message: "요청을 찾을 수 없거나 대기 상태가 아닙니다." });
        }

        await prisma.extend_investment_duration_log.update({
            where: {
                id: request.id
            },
            data: {
                status: status as transaction_status,
                updatedAt: new Date(),
            }
        })
        if (status === "COMPLETED") {
            const investment = await prisma.investment_log.findUnique({
                where: {
                    id: request.investmentLogId
                },
                include: {
                    series: {
                        include: {
                            periods: true,
                            rate: true
                        }
                    }
                }
            })
            if (!investment) {
                return res.status(404).json({ message: "Associated 투자 로그를 찾을 수 없습니다." });
            }
            const { monthly, maturityDate, totalEstimatedProfit, } = getInvestmentAdditionalData({
                userTotalInvestmentAmount: 0,
                investmentDuration: request.newDuration,
                amount: investment.amount,
                createdAt: investment.createdAt,
                series: {
                    periods: investment.series.periods,
                    rate: investment.series.rate
                }
            })
            await prisma.investment_log.update({
                where: {
                    id: request.investmentLogId
                },
                data: {
                    status: "PENDING",
                    investmentDuration: request.newDuration,
                    monthly,
                    totalExpectedProfit: totalEstimatedProfit,
                    maturityDate,
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "요청 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.log("Error in updateExtendInvestmentDurationStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface UpdatePendingInvestmentPayload {
    investmentId: string;
    peakSettlementRate: number;
    leanSettlementRate: number;
    isFixSettlementRate: boolean;
    isSeniorInvestor: boolean;
}

export default async function updatePendingInvestment(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    const { investmentId, leanSettlementRate, peakSettlementRate, isFixSettlementRate, isSeniorInvestor } = req.body as UpdatePendingInvestmentPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "잘못된 투자 및/또는 상태입니다." });
    }
    if (
        (!peakSettlementRate || peakSettlementRate <= 0)
        || (!leanSettlementRate || leanSettlementRate <= 0)
    ) {
        return res.status(400).json({ message: "잘못된 정산율입니다." });
    }
    if (peakSettlementRate < leanSettlementRate) {
        return res.status(400).json({ message: "최대 정산율은 최소 정산율보다 커야 합니다." });
    }

    const processedPeakSettlementRate = peakSettlementRate / 100;
    const processedLeanSettlementRate = leanSettlementRate / 100;

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                id: user.id
            }
        })
        if (!admin) {
            return res.status(401).json({ message: "인증되지 않았습니다." });
        }

        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                status: "PENDING",
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "투자를 찾을 수 없거나 이미 처리되었습니다." });
        }

        await prisma.$transaction(async (tx) => {
            await tx.investment_log.update({
                where: {
                    id: investment.id
                },
                data: {
                    peakSettlementRate: processedPeakSettlementRate,
                    leanSettlementRate: processedLeanSettlementRate,
                    isFixSettlementRate,
                    isSeniorInvestor,
                    updatedAt: new Date(),
                }
            })
            await tx.settlement_rate_log.create({
                data: {
                    id: generateRandomString(7),
                    adminId: admin.id,
                    investmentId: investment.id,
                    peakSettlementRate: processedPeakSettlementRate, //store as decimal
                    leanSettlementRate: processedLeanSettlementRate, //store as decimal
                    type: "INVESTMENT",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })

        return res.status(200).json({ message: "투자가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.log("Error on admin updatePendingInvestment: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
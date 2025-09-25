import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface UpdateSeriesSettlementRatesPayload {
    seriesId: string;
    peakSettlementRate: number;
    leanSettlementRate: number;
}

export default async function updateSeriesSettlementRates(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    const { seriesId, peakSettlementRate, leanSettlementRate } = req.body as UpdateSeriesSettlementRatesPayload;

    if (!seriesId || seriesId.trim() === "") {
        return res.status(400).json({ message: "잘못된 시리즈 ID입니다." });
    }
    if (peakSettlementRate < 0 || peakSettlementRate > 100) {
        return res.status(400).json({ message: "잘못된 최대 정산율입니다." });
    }
    if (leanSettlementRate < 0 || leanSettlementRate > 100) {
        return res.status(400).json({ message: "잘못된 최소 정산율입니다." });
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
        const series = await prisma.series.findUnique({
            where: {
                id: seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "시리즈를 찾을 수 없습니다." });
        }

        await prisma.$transaction(async (tx) => {
            await tx.series.update({
                where: {
                    id: series.id
                },
                data: {
                    peakSettlementRate: processedPeakSettlementRate,
                    leanSettlementRate: processedLeanSettlementRate,
                    updatedAt: new Date(),
                }
            })
            await tx.investment_log.updateMany({
                where: {
                    seriesId: series.id,
                    status: "PENDING",
                    amount: {
                        lt: 100_000_000 //only update for investments < 100M
                    },
                    isFixSettlementRate: false,
                    isSeniorInvestor: false,
                },
                data: {
                    peakSettlementRate: processedPeakSettlementRate,
                    leanSettlementRate: processedLeanSettlementRate,
                    updatedAt: new Date(),
                }
            })
            await tx.settlement_rate_log.create({
                data: {
                    id: generateRandomString(7),
                    adminId: admin.id,
                    seriesId: series.id,
                    seriesSeriesId: series.seriesId,
                    peakSettlementRate: processedPeakSettlementRate, //store as decimal
                    leanSettlementRate: processedLeanSettlementRate, //store as decimal
                    type: "SERIES",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })

        return res.status(200).json({ message: "시리즈 정산율이 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on admin updateSeriesSettlementRates: ", error)
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
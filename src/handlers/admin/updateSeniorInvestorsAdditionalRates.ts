import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateSeniorInvestorsAdditionalRatesPayload {
    seriesId: string;
    additionalPeakSettlementRate: number;
    additionalLeanSettlementRate: number;
}

export default async function updateSeniorInvestorsAdditionalRates(req: Request, res: Response) {
    const { seriesId, additionalLeanSettlementRate, additionalPeakSettlementRate } = req.body as UpdateSeniorInvestorsAdditionalRatesPayload;

    if (!seriesId || seriesId.trim() === "") {
        return res.status(400).json({ message: "잘못된 시리즈 ID입니다." });
    }
    if (additionalPeakSettlementRate < 0 || additionalPeakSettlementRate > 100) {
        return res.status(400).json({ message: "잘못된 추가 최대 정산율입니다." });
    }
    if (additionalLeanSettlementRate < 0 || additionalLeanSettlementRate > 100) {
        return res.status(400).json({ message: "잘못된 추가 최소 정산율입니다." });
    }

    const processedAdditionalPeakSettlementRate = additionalPeakSettlementRate / 100;
    const processedAdditionalLeanSettlementRate = additionalLeanSettlementRate / 100;

    try {
        const series = await prisma.series.findUnique({
            where: {
                id: seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "시리즈를 찾을 수 없습니다." });
        }

        await prisma.series.update({
            where: {
                id: series.id
            },
            data: {
                seniorAdditionalPeakRate: processedAdditionalPeakSettlementRate,
                seniorAdditionalLeanRate: processedAdditionalLeanSettlementRate,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "시리즈가 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateSeniorInvestorsAdditionalRates: ", error)
        return res.status(500).json({ message: "내부 서버 오류." });
    }

}
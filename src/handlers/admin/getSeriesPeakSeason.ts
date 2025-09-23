import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getSeriesPeakSeason(req: Request, res: Response) {
    try {
        const series = await prisma.series.findMany({
            include: {
                peakSeason: true
            },
            orderBy: {
                seriesId: "asc"
            }
        })

        const processedSeries = series.map(s => ({
            ...s,
            peakSettlementRate: s.peakSettlementRate * 100,
            leanSettlementRate: s.leanSettlementRate * 100,
        }))

        return res.status(200).json({ data: processedSeries })
    } catch (error) {
        console.log("Error in getSeriesPeakSeason:", error);
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
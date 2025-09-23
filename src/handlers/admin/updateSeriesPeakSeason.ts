import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { series_payout_schedule } from "@prisma/client";

interface UpdateSeriesPeakSeasonPayload {
    seriesId: string;
    peakSeasonStartMonth: number;
    peakSeasonEndMonth: number;
}

export default async function updateSeriesPeakSeason(req: Request, res: Response) {
    const { seriesId, peakSeasonStartMonth, peakSeasonEndMonth } = req.body as UpdateSeriesPeakSeasonPayload;

    const acceptedPayoutSchedule: series_payout_schedule[] = ["WEEKLY", "MONTHLY", "QUARTERLY"];
    // validate payloads
    if (!seriesId || seriesId.trim() === "") {
        return res.status(400).json({ message: "잘못된 시리즈 ID입니다." });
    }
    if (peakSeasonStartMonth < 1 || peakSeasonStartMonth > 12) {
        return res.status(400).json({ message: "잘못된 성수기 시작 월입니다." });
    }
    if (peakSeasonEndMonth < 1 || peakSeasonEndMonth > 12) {
        return res.status(400).json({ message: "잘못된 성수기 종료 월입니다." });
    }
    if (peakSeasonStartMonth > peakSeasonEndMonth) {
        return res.status(400).json({ message: "성수기 시작 월은 종료 월 이후일 수 없습니다." });
    }

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
                updatedAt: new Date(),
                peakSeason: {
                    update: {
                        peakSeasonStartMonth,
                        peakSeasonEndMonth,
                        updatedAt: new Date()
                    }
                }
            }
        })
        return res.status(200).json({ message: "시리즈가 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateSeriesPeakSeason: ", error)
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
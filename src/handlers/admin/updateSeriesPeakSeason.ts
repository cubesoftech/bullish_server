import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateSeriesPeakSeasonPayload {
    seriesId: string;
    peakSeasonStartMonth: number;
    peakSeasonEndMonth: number;
}

export default async function updateSeriesPeakSeason(req: Request, res: Response) {
    const { seriesId, peakSeasonStartMonth, peakSeasonEndMonth } = req.body as UpdateSeriesPeakSeasonPayload;

    // validate payloads
    if (!seriesId || seriesId.trim() === "") {
        return res.status(400).json({ message: "Invalid series ID." });
    }
    if (peakSeasonStartMonth < 1 || peakSeasonStartMonth > 12) {
        return res.status(400).json({ message: "Invalid peak season start month." });
    }
    if (peakSeasonEndMonth < 1 || peakSeasonEndMonth > 12) {
        return res.status(400).json({ message: "Invalid peak season end month." });
    }
    if (peakSeasonStartMonth > peakSeasonEndMonth) {
        return res.status(400).json({ message: "Peak season start month cannot be after end month." });
    }

    try {
        const series = await prisma.series.findUnique({
            where: {
                id: seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "Series not found." });
        }

        await prisma.series_peak_season.update({
            where: {
                seriesID: series.id
            },
            data: {
                peakSeasonStartMonth,
                peakSeasonEndMonth,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "Series peak season updated." })
    } catch (error) {
        console.log("Error on updateSeriesPeakSeason: ", error)
        return res.status(500).json({ message: "Internal server error." });
    }
}
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

        return res.status(200).json({ data: series })
    } catch (error) {
        console.log("Error in getSeriesPeakSeason:", error);
        return res.status(500).json({ message: "Internal server error." })
    }
}
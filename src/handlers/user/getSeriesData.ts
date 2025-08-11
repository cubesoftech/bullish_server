import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getSeriesData(req: Request, res: Response) {
    try {
        const seriesList = await prisma.series.findMany({
            orderBy: {
                seriesId: "asc"
            },
            select: {
                id: true
            }
        })

        const series1 = await prisma.series_log.count({
            where: {
                seriesId: seriesList[0].id
            }
        })
        const series2 = await prisma.series_log.count({
            where: {
                seriesId: seriesList[1].id
            }
        })
        const series3 = await prisma.series_log.count({
            where: {
                seriesId: seriesList[2].id
            }
        })
        const series4 = await prisma.series_log.count({
            where: {
                seriesId: seriesList[3].id
            }
        })
        const series5 = await prisma.series_log.count({
            where: {
                seriesId: seriesList[4].id
            }
        })
        return res.status(200).json({ data: { series1, series2, series3, series4, series5 } })
    } catch (error) {
        console.error("Error fetching series data:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
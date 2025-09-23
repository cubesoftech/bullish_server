import { Request, Response } from "express"
import { prisma } from "../../utils/prisma"

const generateRandomString = (length: number): string => {
    return Math.random().toString(36).slice(2, 2 + length);
}

// ---------- NOTE ---------- //
// ---------- DONT USE THIS API ENDPOINT TO ADD NEW SERIES ---------- //
// ---------- IF YOU WANT TO ADD NEW SERIES, PLEASE USE THE ADMIN PANEL ---------- //


export default async function generateSeriesData(req: Request, res: Response) {
    // change this data when the series data on frontend changes
    // this endpoint is only for generating series data, not for updating existing series
    const seriesData = [
        {
            seriesId: 1,
            name: "시리즈 1",
            region: "TRUSSEON GLOBAL 체험",
            minAmount: 3_000_000,
            periods: [1, 3],
            rate: { minRate: 0.8, maxRate: 0.8 },
        },
        {
            seriesId: 2,
            name: "시리즈 2",
            region: "중국 · 몽골 · 터키",
            minAmount: 5_000_000,
            periods: [3, 6, 12],
            rate: { minRate: 1.2, maxRate: 2.0 },
        },
        {
            seriesId: 3,
            name: "시리즈 3",
            region: "몰디브, 대만 및 동남아 6개국",
            minAmount: 10_000_000,
            periods: [6, 12],
            rate: { minRate: 1.5, maxRate: 2.5 },
        },
        {
            seriesId: 4,
            name: "시리즈 4",
            region: "두바이 · 일본 · 홍콩 등",
            minAmount: 30_000_000,
            periods: [12, 24],
            rate: { minRate: 2.0, maxRate: 3.0 },
        },
        {
            seriesId: 5,
            name: "시리즈 5",
            region: "하와이 · 괌 · 사이판",
            minAmount: 50_000_000,
            periods: [12, 24, 36],
            rate: { minRate: 2.5, maxRate: 3.0 },
        },
    ];

    try {
        const series = await prisma.series.count();
        if (series > 0) {
            return res.status(400).json({ error: "Series already exists" });
        }

        await prisma.$transaction(seriesData.map((series) =>
            prisma.series.create({
                data: {
                    id: generateRandomString(7),
                    seriesId: series.seriesId,
                    name: series.name,
                    region: series.region,
                    minAmount: series.minAmount,
                    periods: {
                        create: series.periods.map(p => ({
                            id: generateRandomString(7),
                            period: p,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }))
                    },
                    rate: {
                        create: {
                            id: generateRandomString(7),
                            minRate: series.rate.minRate,
                            maxRate: series.rate.maxRate,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    peakSeason: {
                        create: {
                            id: generateRandomString(7),
                            peakSeasonStartMonth: 1,
                            peakSeasonEndMonth: 12,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        ))
        return res.status(200).json({ message: "Series created successfully" });
    } catch (err) {
        console.error("Error creating series:", err);
        return res.status(500).json({ error: "내부 서버 오류." });
    }
}
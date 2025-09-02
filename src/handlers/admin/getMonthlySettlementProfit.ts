import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { MonthlyDeposit, YearlyDeposit } from "../../utils/interface";

export default async function getMonthlySettlementProfit(req: Request, res: Response) {
    const now = new Date()
    try {

        // get the first settlement profit
        const firstSettlementProfit = await prisma.profit_log.findMany({
            orderBy: {
                createdAt: 'asc'
            }
        })

        if (firstSettlementProfit.length === 0) {
            // no settlement profit yet
            return res.status(200).json({ month: 0, year: 0, monthDifference: 0, deposits: [] });
        }

        // get first settlement profit month
        const firstSettlementProfitMonth = firstSettlementProfit[0].createdAt.getMonth();
        const firstSettlementProfitYear = firstSettlementProfit[0].createdAt.getFullYear();

        const monthDifference =
            (now.getFullYear() - firstSettlementProfitYear) * 12 +
            (now.getMonth() - firstSettlementProfitMonth);

        const depositsByYear: YearlyDeposit[] = []

        for (let i = 0; i < monthDifference; i++) {
            const year = firstSettlementProfitYear + Math.floor((firstSettlementProfitMonth + i) / 12);
            const month = (firstSettlementProfitMonth + i) % 12; // still 0-indexed

            const monthlySettlementRate = await prisma.profit_log.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(year, month, 1),
                        lt: new Date(year, month + 1, 1)
                    }
                },
                _sum: { profit: true },
                _count: { _all: true }
            });

            const data: MonthlyDeposit = {
                month: month + 1, // convert to 1–12
                year,
                totalAmount: monthlySettlementRate._sum.profit ?? 0,
                totalCount: monthlySettlementRate._count._all
            }

            let yearBucket = depositsByYear.find(d => d.year === year)
            if (!yearBucket) {
                yearBucket = { year, months: [] }
                depositsByYear.push(yearBucket)
            }
            yearBucket.months.push(data)
        }

        return res.status(200).json({ data: depositsByYear });
    } catch (error) {
        console.error("Error fetching monthly deposit:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
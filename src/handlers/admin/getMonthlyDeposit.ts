import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { MonthlyDeposit, YearlyDeposit } from "../../utils/interface";

export default async function getMonthlyDeposit(req: Request, res: Response) {
    const now = new Date()
    try {

        // get the first deposit
        const firstDeposit = await prisma.deposit_log.findMany({
            where: {
                status: "COMPLETED"
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        if (firstDeposit.length === 0) {
            // no completed deposit yet
            return res.status(200).json({ month: 0, year: 0, monthDifference: 0, deposits: [] });
        }

        // get first deposit month
        const firstDepositMonth = firstDeposit[0].createdAt.getMonth();
        const firstDepositYear = firstDeposit[0].createdAt.getFullYear();

        const monthDifference =
            (now.getFullYear() - firstDepositYear) * 12 +
            (now.getMonth() - firstDepositMonth);

        const depositsByYear: YearlyDeposit[] = []

        for (let i = 0; i < monthDifference; i++) {
            const year = firstDepositYear + Math.floor((firstDepositMonth + i) / 12);
            const month = (firstDepositMonth + i) % 12; // still 0-indexed

            const monthlyDeposit = await prisma.deposit_log.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: new Date(year, month, 1),
                        lt: new Date(year, month + 1, 1)
                    }
                },
                _sum: { amount: true },
                _count: { _all: true }
            });

            const data: MonthlyDeposit = {
                month: month + 1, // convert to 1–12
                year,
                totalAmount: monthlyDeposit._sum.amount ?? 0,
                totalCount: monthlyDeposit._count._all
            }

            let yearBucket = depositsByYear.find(d => d.year === year)
            if (!yearBucket) {
                yearBucket = { year, months: [] }
                depositsByYear.push(yearBucket)
            }
            yearBucket.months.push(data)
        }

        depositsByYear.reverse()

        return res.status(200).json({ data: depositsByYear });
    } catch (error) {
        console.error("Error fetching monthly deposit:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { MonthlyDeposit, YearlyDeposit } from "../../utils/interface";

export default async function getMonthlyWithdrawals(req: Request, res: Response) {
    const now = new Date()
    try {

        // get the first withdrawal
        const firstWithdrawal = await prisma.withdrawal_log.findMany({
            where: {
                status: "COMPLETED"
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        if (firstWithdrawal.length === 0) {
            // no completed withdrawal yet
            return res.status(200).json({ month: 0, year: 0, monthDifference: 0, deposits: [] });
        }

        // get first withdrawal month
        const firstWithdrawalMonth = firstWithdrawal[0].createdAt.getMonth();
        const firstWithdrawalYear = firstWithdrawal[0].createdAt.getFullYear();

        const monthDifference =
            (now.getFullYear() - firstWithdrawalYear) * 12 +
            (now.getMonth() - firstWithdrawalMonth);

        const depositsByYear: YearlyDeposit[] = []

        for (let i = 0; i < monthDifference; i++) {
            const year = firstWithdrawalYear + Math.floor((firstWithdrawalMonth + i) / 12);
            const month = (firstWithdrawalMonth + i) % 12; // still 0-indexed

            const monthlyWithdrawal = await prisma.withdrawal_log.aggregate({
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
                totalAmount: monthlyWithdrawal._sum.amount ?? 0,
                totalCount: monthlyWithdrawal._count._all
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
        console.error("Error fetching monthly withdrawal:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { investment_log, Prisma, transaction_status } from "@prisma/client";
import { addDays, endOfDay, startOfDay, subDays, subMonths } from "date-fns";

export default async function getInvestmentLog2(req: Request, res: Response) {
    const { page, limit, search, type } = req.query;

    const acceptedTypes = ["today", "week"]

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 25;

    if (type && !acceptedTypes.includes(type as string)) {
        return res.status(400).json({ message: "Invalid type filter" });
    }
    const now = new Date();
    try {
        const investment = await prisma.investment_log.findMany({
            where: {
                status: "PENDING"
            },
            orderBy: {
                createdAt: "asc"
            },
            select: {
                createdAt: true
            },
            take: 1
        })

        const oldestPendingInvestmentDate = new Date(investment[0].createdAt)

        const weekly: Date[] = []
        const monthly: Date[] = []
        const quarterly: Date[] = []

        const sevenDaysToGo = addDays(now, 7)

        if (type === "today") {
            for (let i = subDays(now, 7); i >= subDays(oldestPendingInvestmentDate, 7); i = subDays(i, 7)) {
                weekly.push(new Date(i))
            }
            for (let i = now; i >= oldestPendingInvestmentDate; i = subMonths(i, 1)) {
                monthly.push(new Date(i))
            }
            for (let i = now; i >= oldestPendingInvestmentDate; i = subMonths(i, 3)) {
                quarterly.push(new Date(i))
            }
        } else {
            for (let a = now; a < sevenDaysToGo; a = addDays(a, 1)) {

                for (let b = subDays(a, 7); b >= subDays(oldestPendingInvestmentDate, 7); b = subDays(b, 7)) {
                    weekly.push(new Date(b))
                }
                for (let b = a; b >= oldestPendingInvestmentDate; b = subMonths(b, 1)) {
                    monthly.push(new Date(b))
                }
                for (let b = a; b >= oldestPendingInvestmentDate; b = subMonths(b, 3)) {
                    quarterly.push(new Date(b))
                }
            }
        }

        let where: Prisma.investment_logWhereInput = {
            status: "PENDING",
            OR: [
                ...weekly.map(date => ({
                    createdAt: {
                        gte: startOfDay(date),
                        lte: endOfDay(date),
                    }
                })),
                ...monthly.map(date => ({
                    createdAt: {
                        gte: startOfDay(date),
                        lte: endOfDay(date),
                    }
                })),
                ...quarterly.map(date => ({
                    createdAt: {
                        gte: startOfDay(date),
                        lte: endOfDay(date),
                    }
                })),
            ]
        }

        if (search) {
            where = {
                ...where,
                user: {
                    name: {
                        contains: search as string,
                    }
                }
            }
        }

        const investments = await prisma.investment_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: true,
                series: {
                    include: {
                        periods: true,
                        rate: true,
                        peakSeason: true,
                    }
                }
            }
        })
        const totalInvestments = await prisma.investment_log.count({ where })

        const processedInvestmentLogs = await Promise.all(
            investments.map(async investment => {
                const lastProfit = await prisma.profit_log.findFirst({
                    where: {
                        investmentLogId: investment.id
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                })
                let isPaid: transaction_status = "PENDING"

                if (investment.payoutSchedule === "WEEKLY" && lastProfit) {
                    if (lastProfit.createdAt >= subDays(now, 7)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (investment.payoutSchedule === "MONTHLY" && lastProfit) {
                    if (lastProfit.createdAt >= subMonths(now, 1)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (investment.payoutSchedule === "QUARTERLY" && lastProfit) {
                    if (lastProfit.createdAt >= subMonths(now, 3)) {
                        isPaid = "COMPLETED"
                    }
                }
                if (!lastProfit) {
                    isPaid = "PENDING"
                }
                return {
                    ...investment,
                    isPaid,
                    settlementRate: investment.settlementRate * 100,
                    peakSettlementRate: investment.peakSettlementRate * 100,
                    leanSettlementRate: investment.leanSettlementRate * 100,
                    user: {
                        ...investment.user,
                        baseSettlementRate: investment.user.baseSettlementRate * 100,
                        referrerPoints: Number(investment.user.referrerPoints),
                    }
                }
            })
        )

        return res.status(200).json({ data: processedInvestmentLogs, total: totalInvestments });
    } catch (error) {
        console.error("Error fetching investment log: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
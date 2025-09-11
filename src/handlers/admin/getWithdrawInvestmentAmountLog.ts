import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { Prisma } from "@prisma/client";

export default async function getWithdrawInvestmentAmountLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.investment_amount_withdrawal_logWhereInput = {}

    if (search) {
        where = {
            user: {
                name: {
                    contains: search as string,
                }
            }
        }
    }

    try {
        const withdrawals = await prisma.investment_amount_withdrawal_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: true,
                investmentLog: {
                    include: {
                        series: true,
                    }
                },
            }
        })
        const totalWithdrawals = await prisma.investment_amount_withdrawal_log.count({ where })

        const processedWithdrawals = withdrawals.map(withdrawal => ({
            ...withdrawal,
            user: {
                ...withdrawal.user,
                referrerPoints: Number(withdrawal.user?.referrerPoints),
                baseSettlementRate: withdrawal.user.baseSettlementRate * 100,
            },
            investmentLog: {
                ...withdrawal.investmentLog,
                settlementRate: withdrawal.investmentLog.settlementRate * 100,
                peakSettlementRate: withdrawal.investmentLog.peakSettlementRate * 100,
                leanSettlementRate: withdrawal.investmentLog.leanSettlementRate * 100,
            }
        }))

        return res.status(200).json({ data: processedWithdrawals, total: totalWithdrawals });
    } catch (error) {
        console.error("Error fetching withdrawal requests: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
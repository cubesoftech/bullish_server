import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";
import { addMonths, differenceInDays, differenceInMinutes, differenceInMonths, subMonths } from "date-fns";

export default async function getInvestmentEarlyWithdrawalLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.investment_early_withdrawal_logWhereInput = {}

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
        const requests = await prisma.investment_early_withdrawal_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true,
                investmentLog: {
                    include: {
                        series: true,
                    }
                }
            }
        })
        const totalRequests = await prisma.investment_early_withdrawal_log.count({ where })

        const processedInquiries = requests.map(inquiry => {
            // get the maturity date of investment
            const maturityDate = addMonths(
                inquiry.investmentLog.createdAt,
                inquiry.investmentLog.investmentDuration
            );

            const months = differenceInMonths(
                maturityDate,
                inquiry.createdAt
            )
            const days = differenceInDays(
                maturityDate,
                addMonths(inquiry.createdAt, months)
            )

            const processedMonths = days >= 15 ? months + 1 : months;
            const monthsCovered = inquiry.investmentLog.investmentDuration - processedMonths;

            const remainingPeriodFactor = processedMonths / inquiry.investmentLog.investmentDuration;
            const withdrawalFee = inquiry.investmentLog.amount * (18 / 100) * remainingPeriodFactor;
            const refundableAmount = inquiry.investmentLog.amount - withdrawalFee
            return {
                ...inquiry,
                monthsCovered,
                withdrawalFee,
                refundableAmount,
                user: {
                    ...inquiry.user,
                    referrerPoints: Number(inquiry.user.referrerPoints),
                }
            }
        })

        return res.status(200).json({ data: processedInquiries, total: totalRequests });
    } catch (error) {
        console.error("Error admin getInvestmentEarlyWithdrawalLog: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
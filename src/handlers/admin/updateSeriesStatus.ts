import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { distributeInvestmentProfitQueueUpsertJobScheduler } from "../../services/distributeInvestmentProfit";
import { generateRandomString, getInvestmentAdditionalData } from "../../utils";

interface UpdateInvestmentPayload {
    seriesId: string;
    status: string;
}

export default async function updateSeriesStatus(req: Request, res: Response) {
    const { seriesId, status } = req.body as UpdateInvestmentPayload;

    const acceptedStatus = ["COMPLETED", "FAILED"];

    if (
        (!seriesId || seriesId.trim() === "") ||
        !acceptedStatus.includes(status)
    ) {
        return res.status(400).json({ message: "Invalid investment and/or status." });
    }

    try {
        const series = await prisma.series_log.findFirst({
            where: {
                id: seriesId,
                status: "PENDING",
            },
            include: {
                user: true,
                series: {
                    include: {
                        periods: {
                            orderBy: {
                                period: "desc"
                            }
                        },
                        rate: true,
                    }
                },
            }
        })
        if (!series) {
            return res.status(404).json({ message: "Investment not found or already processed" });
        }

        await prisma.series_log.update({
            where: {
                id: seriesId
            },
            data: {
                status: status as any,
                updatedAt: new Date(),
            }
        });
        // give back the amount to user if investment failed
        if (status === "FAILED") {
            await prisma.users.update({
                where: {
                    id: series.userId
                },
                data: {
                    balance: {
                        increment: series.amount
                    },
                    updatedAt: new Date(),
                }
            })
        }

        if (status === "COMPLETED") {
            const { monthly, settlementRate, maturityDate, totalEstimatedProfit } = getInvestmentAdditionalData({
                amount: series.amount,
                createdAt: new Date(),
                series: {
                    periods: series.series.periods,
                    rate: series.series.rate,
                }
            })
            const investment = await prisma.investment_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: series.userId,
                    seriesLogId: series.id,
                    seriesId: series.seriesId,
                    amount: series.amount,
                    monthly,
                    settlementRate,
                    maturityDate,
                    totalExpectedProfit: totalEstimatedProfit,
                }
            })
            // add the user on the job if the investment gets approved
            await distributeInvestmentProfitQueueUpsertJobScheduler(investment);
        }
        return res.status(200).json({ message: "Investment status updated successfully" });
    } catch (error) {
        console.error("Error updating investment status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}

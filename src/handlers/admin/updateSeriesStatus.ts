import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { distributeInvestmentProfitQueueUpsertJobScheduler } from "../../services/distributeInvestmentProfit";
import { generateRandomString, getInvestmentAdditionalData } from "../../utils";
import { distributeMonthlyReferrerRewardQueueUpsertJobScheduler } from "../../services/distributeMonthyReferrerReward";
import { distributeMonthlySettlementRateQueueUpsertJobScheduler } from "../../services/distributeMonthlySettlementRate";

interface UpdateInvestmentPayload {
    seriesId: string;
    status: string;
    peakSettlementRate: number;
    leanSettlementRate: number;
}

export default async function updateSeriesStatus(req: Request, res: Response) {
    const { seriesId, status, peakSettlementRate, leanSettlementRate } = req.body as UpdateInvestmentPayload;

    const acceptedStatus = ["COMPLETED", "FAILED"];

    if (
        (!seriesId || seriesId.trim() === "") ||
        !acceptedStatus.includes(status)
    ) {
        return res.status(400).json({ message: "잘못된 투자 및/또는 상태입니다." });
    }
    if (status === "COMPLETED") {
        if (
            (!peakSettlementRate || peakSettlementRate <= 0)
            || (!leanSettlementRate || leanSettlementRate <= 0)
        ) {
            return res.status(400).json({ message: "잘못된 정산율입니다." });
        }
        if (peakSettlementRate < leanSettlementRate) {
            return res.status(400).json({ message: "최대 정산율은 최소 정산율보다 커야 합니다." });
        }
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
            return res.status(404).json({ message: "투자를 찾을 수 없거나 이미 처리되었습니다." });
        }

        const user = await prisma.users.findUnique({
            where: {
                id: series.userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const userTotalInvestmentAmount = await prisma.investment_log.aggregate({
            where: {
                userId: user.id
            },
            _sum: {
                amount: true
            }
        })

        await prisma.series_log.update({
            where: {
                id: seriesId
            },
            data: {
                status: status as any,
                updatedAt: new Date(),
            }
        });

        if (status === "COMPLETED") {
            const { monthly, settlementRate, maturityDate, totalEstimatedProfit } = getInvestmentAdditionalData({
                // amount is the user's total investment
                userTotalInvestmentAmount: userTotalInvestmentAmount._sum.amount || 0,
                investmentDuration: series.investmentDuration,
                amount: series.amount,
                createdAt: new Date(),
                series: {
                    periods: series.series.periods,
                    rate: series.series.rate,
                }
            })
            const processedPeakSettlementRate = peakSettlementRate / 100; // convert from percent to decimal
            const processedLeanSettlementRate = leanSettlementRate / 100; // convert from percent to decimal

            const seriesLeanSettlementRate = series.series.leanSettlementRate; // convert from percent to decimal
            const seriesPeakSettlementRate = series.series.peakSettlementRate; // convert from percent to decimal
            const investment = await prisma.investment_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: series.userId,
                    seriesLogId: series.id,
                    seriesId: series.seriesId,
                    amount: series.amount,
                    monthly,
                    settlementRate,
                    payoutSchedule: series.payoutSchedule,
                    peakSettlementRate: processedPeakSettlementRate,
                    leanSettlementRate: processedLeanSettlementRate,
                    investmentDuration: series.investmentDuration,
                    maturityDate,
                    totalExpectedProfit: totalEstimatedProfit,
                }
            })

            // ---------- LOGIC FOR ADDING REFERRER TO THE REFERRER POINT DISTRIBUTION JOB ---------- //
            const { investorReferrerId, referrerId } = user
            // only run if referred by user
            if (referrerId) {
                if (!investorReferrerId) {
                    // if hindi pa naka set and investorReferrerId then set it 
                    await prisma.users.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            investorReferrerId: referrerId,
                            updatedAt: new Date()
                        }
                    })
                }

                // get the referrer info
                const referrer = await prisma.users.findUnique({
                    where: {
                        id: referrerId
                    },
                    include: {
                        referredInvestors: true
                    }
                })

                if (referrer) {

                    if (referrer.referredInvestors.length <= 20) {
                        // if already has investorReferrerId, skip
                        if (!investorReferrerId) {
                            await prisma.$transaction(async (tx) => {
                                await tx.monthly_referrer_profit_log.create({
                                    data: {
                                        id: generateRandomString(7),
                                        userId: referrer.id,
                                        amount: 0.1 / 100, //0.1%
                                        type: "REFERRER1",
                                        referredUserId: user.id,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                })
                                await tx.users.update({
                                    where: {
                                        id: referrer.id
                                    },
                                    data: {
                                        baseSettlementRate: {
                                            increment: 0.1 / 100 //increment by 0.1%
                                        },
                                        updatedAt: new Date()
                                    }
                                })
                                await tx.referred_investors_log.create({
                                    data: {
                                        id: generateRandomString(7),
                                        referrerId: referrer.id,
                                        referredInvestorId: user.id,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                })
                            })
                        }
                    } else {
                        const referrerAlreadyReachedLimit = await prisma.user_reached_referral_limit_log.findUnique({
                            where: {
                                userId: referrer.id
                            }
                        })

                        if (!investorReferrerId) {
                            await prisma.referred_investors_log.create({
                                data: {
                                    id: generateRandomString(7),
                                    referrerId: referrer.id,
                                    referredInvestorId: user.id,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }
                            })
                        }

                        if (!referrerAlreadyReachedLimit) {
                            await prisma.user_reached_referral_limit_log.create({
                                data: {
                                    id: generateRandomString(7),
                                    userId: referrer.id,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }
                            })
                            await distributeMonthlyReferrerRewardQueueUpsertJobScheduler(referrer)
                        }
                    }
                }
            }

            // add the user on the jobs if the investment gets approved
            // await distributeInvestmentProfitQueueUpsertJobScheduler(investment);
        }
        return res.status(200).json({ message: "투자 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating investment status:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}

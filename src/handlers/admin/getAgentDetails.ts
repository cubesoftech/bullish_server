import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface GetAgentDetailsPayload {
    agentId: string;
}

export default async function getAgentDetails(req: Request, res: Response) {
    const { agentId } = req.body as GetAgentDetailsPayload;

    if (!agentId || agentId.trim() === '') {
        return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    try {
        const agent = await prisma.agents.findUnique({
            where: {
                id: agentId
            },
            include: {
                referredUsers: {
                    include: {
                        investment_log: {
                            where: {
                                series: {
                                    seriesId: {
                                        not: 1
                                    }
                                }
                            },
                            include: {
                                series: {
                                    include: {
                                        rate: true,
                                        periods: true,
                                        peakSeason: true,
                                    }
                                },
                                user: true,
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                        }
                    }
                }
            }
        })
        if (!agent) {
            return res.status(404).json({ message: "에이전트를 찾을 수 없습니다." });
        }

        const processedAgent = {
            ...agent,
            referredUsers: agent.referredUsers.map(user => ({
                ...user,
                referrerPoints: Number(user.referrerPoints),
                baseSettlementRate: Number(user.baseSettlementRate) * 100,
                investment_log: user.investment_log.map(investment => ({
                    ...investment,
                    settlementRate: investment.settlementRate * 100,
                    peakSettlementRate: investment.peakSettlementRate * 100,
                    leanSettlementRate: investment.leanSettlementRate * 100,
                    user: {
                        ...investment.user,
                        referrerPoints: Number(investment.user.referrerPoints),
                        baseSettlementRate: Number(investment.user.baseSettlementRate) * 100,
                    }
                }))
            }))
        }



        return res.status(200).json({ data: processedAgent })
    } catch (error) {
        console.error("Error fetching agent details: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
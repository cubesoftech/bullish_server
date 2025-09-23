import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { PrismaClient } from "@prisma/client";

interface UpdateAgentIncentiveStatusPayload {
    investmentLogId: string;
    incentives: number;
}

export default async function updateAgentIncentiveStatus(req: Request, res: Response) {
    const { investmentLogId, incentives } = req.body as UpdateAgentIncentiveStatusPayload;

    if (!investmentLogId || investmentLogId.trim() === '') {
        return res.status(400).json({ message: "잘못된 요청입니다." });
    }

    if (incentives <= 0) {
        return res.status(400).json({ message: "잘못된 인센티브 금액입니다." });
    }

    try {
        const investmentLog = await prisma.investment_log.findUnique({
            where: {
                id: investmentLogId,
                isAgentPaid: false,
            }
        })
        if (!investmentLog) {
            return res.status(404).json({ message: "투자 내역을 찾을 수 없습니다." });
        }

        await prisma.$transaction(async (tx) => {
            await tx.investment_log.update({
                where: {
                    id: investmentLogId
                },
                data: {
                    isAgentPaid: true,
                    updatedAt: new Date(),
                }
            })
            await tx.agent_incentive_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: investmentLog.userId,
                    investmentLogId: investmentLog.id,
                    amount: incentives,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        })

        return res.status(200).json({ message: "에이전트 인센티브 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating agent incentive status: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
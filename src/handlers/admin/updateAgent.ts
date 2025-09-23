import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateAgentPayload {
    id: string;
    name: string;
    commissionRate: number;
    subCommissionLimit: number;
    settlementCycle: string;
    note: string;
}

export default async function updateAgent(req: Request, res: Response) {
    const { id, name, commissionRate, subCommissionLimit, settlementCycle, note } = req.body as UpdateAgentPayload;

    if (!id || id.trim() === "") {
        return res.status(400).json({ message: "에이전트 ID는 필수입니다." });
    }
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "잘못된 이름입니다." });
    }
    if (!settlementCycle || settlementCycle.trim() === "") {
        return res.status(400).json({ error: "잘못된 정산 주기입니다." });
    }

    const acceptedSettlementCycles = ["WEEKLY", "2WEEKS", "MONTHLY"];
    if (!acceptedSettlementCycles.includes(settlementCycle.toUpperCase())) {
        return res.status(400).json({ error: "잘못된 정산 주기입니다." });
    }

    try {
        const agent = await prisma.agents.findFirst({
            where: {
                id
            }
        })
        if (!agent) {
            return res.status(404).json({ message: "에이전트를 찾을 수 없습니다." });
        }

        await prisma.agents.update({
            where: {
                id
            },
            data: {
                note,
                name,
                commissionRate,
                subCommissionLimit,
                settlementCycle,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ message: "에이전트가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating agent: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
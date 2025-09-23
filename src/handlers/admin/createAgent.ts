import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface CreateAgentPayload {
    name: string;
    commissionRate: number;
    subCommissionLimit: number;
    settlementCycle: string;
}

export default async function createAgent(req: Request, res: Response) {
    const { name, commissionRate, subCommissionLimit, settlementCycle } = req.body as CreateAgentPayload;

    if (
        (!name || name.trim() === "")
        || (!settlementCycle || settlementCycle.trim() === "")
    ) {
        return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
    }

    const acceptedSettlementCycles = ["WEEKLY", "2WEEKS", "MONTHLY"]
    if (!acceptedSettlementCycles.includes(settlementCycle.toUpperCase())) {
        return res.status(400).json({ error: "잘못된 정산 주기입니다." });
    }

    try {
        await prisma.agents.create({
            data: {
                id: generateRandomString(7),
                name,
                commissionRate,
                subCommissionLimit,
                settlementCycle,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        return res.status(201).json({ message: "에이전트가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error creating agent:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
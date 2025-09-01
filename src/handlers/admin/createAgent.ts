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
        || (!commissionRate || isNaN(commissionRate) || commissionRate < 0)
        || (!subCommissionLimit || isNaN(subCommissionLimit) || subCommissionLimit < 0)
        || (!settlementCycle || settlementCycle.trim() === "")
    ) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const acceptedSettlementCycles = ["WEEKLY", "MONTHLY"]
    if (!acceptedSettlementCycles.includes(settlementCycle.toUpperCase())) {
        return res.status(400).json({ error: "Invalid settlement cycle" });
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

        return res.status(201).json({ message: "Agent created successfully" });
    } catch (error) {
        console.error("Error creating agent:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
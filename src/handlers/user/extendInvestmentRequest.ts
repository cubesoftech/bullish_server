import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface ExtendInvestmentRequestPayload {
    investmentLogId: string;
    newInvestmentDuration: number;
}

export default async function extendInvestmentRequest(req: Request, res: Response) {
    const { investmentLogId, newInvestmentDuration } = req.body as ExtendInvestmentRequestPayload;

    if (!investmentLogId || investmentLogId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment log ID" });
    }
    if (!newInvestmentDuration || newInvestmentDuration <= 0 || newInvestmentDuration > 36) {
        return res.status(400).json({ message: "Invalid duration" });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentLogId,
            }
        });
        if (!investment) {
            return res.status(404).json({ message: "Investment log not found" });
        }
        if (newInvestmentDuration <= investment.investmentDuration) {
            return res.status(400).json({ message: "New investment duration must be greater than current duration" });
        }

        const hasExistingRequest = await prisma.extend_investment_duration_log.findFirst({
            where: {
                investmentLogId: investment.id,
                status: "PENDING",
            }
        });
        if (hasExistingRequest) {
            return res.status(400).json({ message: "There is already a pending extension request for this investment." });
        }

        await prisma.extend_investment_duration_log.create({
            data: {
                id: generateRandomString(7),
                userId: investment.userId,
                investmentLogId: investment.id,
                newDuration: newInvestmentDuration,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        await notifyAdmin();
        return res.status(200).json({ message: "Investment duration extension request submitted successfully" });
    } catch (error) {
        console.log("Error in extendInvestmentRequest:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
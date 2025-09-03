import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdatePendingInvestmentPayload {
    investmentId: string;
    peakSettlementRate: number;
    leanSettlementRate: number;
}

export default async function updatePendingInvestment(req: Request, res: Response) {
    const { investmentId, leanSettlementRate, peakSettlementRate } = req.body as UpdatePendingInvestmentPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment and/or status." });
    }
    if (
        (!peakSettlementRate || peakSettlementRate <= 0)
        || (!leanSettlementRate || leanSettlementRate <= 0)
    ) {
        return res.status(400).json({ message: "Invalid settlement rates." });
    }
    if (peakSettlementRate < leanSettlementRate) {
        return res.status(400).json({ message: "Peak settlement rate must be greater than lean settlement rate." });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                status: "PENDING",
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "Investment not found or already processed" });
        }

        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                peakSettlementRate: peakSettlementRate / 100,
                leanSettlementRate: leanSettlementRate / 100,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "Investment updated successfully." });
    } catch (error) {
        console.log("Error on admin updatePendingInvestment: ", error)
        return res.status(500).json({ message: "Internal server error." })
    }
}
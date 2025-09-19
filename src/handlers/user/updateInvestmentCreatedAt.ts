import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { addMonths } from "date-fns";

interface UpdateInvestmentCreatedAtPayload {
    investmentId: string;
    newCreatedAt: string;
}

export default async function updateInvestmentCreatedAt(req: Request, res: Response) {
    const { investmentId, newCreatedAt } = req.body as UpdateInvestmentCreatedAtPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment ID." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "Invalid new investment date." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "Investment not found." })
        }

        if (investment.status !== "PENDING") {
            return res.status(400).json({ message: "Investment not on pending." })
        }

        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                maturityDate: addMonths(processedNewCreatedAt, investment.investmentDuration),
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Investment updated successfully." })
    } catch (error) {
        console.log("Error on updateInvestmentCreatedAt: ", error)
        return res.status(500).json({ message: "Internal server error." })
    }
}
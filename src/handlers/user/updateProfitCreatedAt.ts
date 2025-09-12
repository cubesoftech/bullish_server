import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateProfitCreatedAtPayload {
    profitId: string;
    newCreatedAt: string;
}

export default async function updateProfitCreatedAt(req: Request, res: Response) {
    const { profitId, newCreatedAt } = req.body as UpdateProfitCreatedAtPayload;

    if (!profitId || profitId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment ID." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "Invalid new investment date." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const profit = await prisma.profit_log.findUnique({
            where: {
                id: profitId
            }
        })
        if (!profit) {
            return res.status(404).json({ message: "Investment not found." })
        }

        await prisma.profit_log.update({
            where: {
                id: profit.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Investment profit updated successfully." })
    } catch (error) {
        console.log("Error on updateProfitCreatedAt: ", error)
        return res.status(500).json({ message: "Internal server error." })
    }
}
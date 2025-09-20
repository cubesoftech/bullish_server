import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface DeleteProfitPayload {
    profitId: string;
}

export default async function deleteProfit(req: Request, res: Response) {
    const { profitId } = req.body as DeleteProfitPayload;

    if (!profitId || profitId.trim() === "") {
        return res.status(400).json({ message: "Insufficient information." });
    }

    try {
        const profit = await prisma.profit_log.findUnique({
            where: {
                id: profitId
            }
        })
        if (!profit) {
            return res.status(404).json({ message: "Profit record not found." });
        }

        await prisma.profit_log.delete({
            where: {
                id: profitId
            }
        })

        return res.status(200).json({ message: "Profit record deleted successfully." });
    } catch (error) {
        console.error("Error on deleteProfit: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}

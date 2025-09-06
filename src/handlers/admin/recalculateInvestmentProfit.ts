import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface RecalculateInvestmentProfitPayload {
    investmentId: string;
    amount: number;
    type: "ADD" | "SUBTRACT";
}

export default async function recalculateInvestmentProfit(req: Request, res: Response) {
    const { investmentId, amount, type } = req.body as RecalculateInvestmentProfitPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment ID." });
    }
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount." });
    }
    if (type !== "ADD" && type !== "SUBTRACT") {
        return res.status(400).json({ message: "Invalid type." });
    }

    try {
        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "Investment not found." });
        }

        let profit = investment.totalProfit || 0;
        if (type === "ADD") {
            profit += amount;
            await prisma.users.update({
                where: {
                    id: investment.userId
                },
                data: {
                    balance: {
                        increment: amount
                    },
                    updatedAt: new Date()
                }
            })
        } else {
            profit -= amount;
            if (profit < 0) profit = 0; // prevent negative profit

            await prisma.users.update({
                where: {
                    id: investment.userId
                },
                data: {
                    balance: {
                        decrement: amount
                    },
                    updatedAt: new Date()
                }
            })
        }

        await prisma.investment_log.update({
            where: {
                id: investment.id
            },
            data: {
                totalProfit: profit,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Investment profit recalculated successfully." });
    } catch (error) {
        console.log("Error in recalculateInvestmentProfit:", error);
        return res.status(500).json({ message: "Internal server error." })
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface RequestInvestmentEarlyWithdrawalPayload {
    investmentId: string;
}

export default async function requestInvestmentEarlyWithdrawal(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { investmentId } = req.body as RequestInvestmentEarlyWithdrawalPayload;
    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "Invalid investment ID" });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id,
                status: true,
                isDeleted: false,
            },
        });
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                status: "PENDING",
                userId: user.id
            }
        })
        if (!investment) {
            return res.status(404).json({ message: "Investment not found or not eligible for early withdrawal" });
        }

        const existingRequest = await prisma.investment_early_withdrawal_log.findFirst({
            where: {
                investmentLogId: investment.id,
                userId: user.id,
                status: "PENDING"
            }
        })
        if (existingRequest) {
            return res.status(400).json({ message: "An early withdrawal request for this investment already exists" });
        }

        await prisma.investment_early_withdrawal_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                investmentLogId: investment.id,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        await notifyAdmin();
        return res.status(200).json({ message: "Early withdrawal requested successfully/" });
    } catch (error) {
        console.error("Error requestInvestmentEarlyWithdrawal:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}
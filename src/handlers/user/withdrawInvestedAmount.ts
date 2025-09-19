import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface WithdrawInvestedAmountPayload {
    investmentId: string;
}

export default async function withdrawInvestedAmount(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    const { id } = user
    const { investmentId } = req.body as WithdrawInvestedAmountPayload;

    if (!investmentId || investmentId.trim() === "") {
        return res.status(400).json({ message: "Invalid investmentId" })
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id,
                status: true,
                isDeleted: false
            }
        })

        if (!userInfo) {
            return res.status(404).json({ message: "User not found" })
        }

        const investment = await prisma.investment_log.findUnique({
            where: {
                id: investmentId,
                userId: userInfo.id,
                status: "COMPLETED"
            }
        })

        if (!investment) {
            return res.status(404).json({ message: "Investment not found" })
        }

        const hasExistingRequest = await prisma.investment_amount_withdrawal_log.findFirst({
            where: {
                investmentLogId: investment.id,
                status: "PENDING"
            }
        })

        if (hasExistingRequest) {
            return res.status(400).json({ message: "You already have a pending withdrawal request for this investment." })
        }

        await prisma.investment_amount_withdrawal_log.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                investmentLogId: investment.id,
                amount: investment.amount,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        await notifyAdmin();

        return res.status(200).json({ message: "Withdrawal request submitted successfully" })
    } catch (error) {
        console.error("Error withdrawInvestedAmount:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
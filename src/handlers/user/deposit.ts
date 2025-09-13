import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { TransactionPayload } from "../../utils/interface";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

export default async function deposit(req: Request, res: Response) {
    const { user } = req;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount } = req.body as TransactionPayload;

    // Validate required fields
    const validateFields = !(
        isNaN(amount)
        || !Number.isFinite(amount)
        || amount <= 0
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Invalid deposit amount" });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(400).json({ message: "Invalid phone number or password" });
        }

        await prisma.deposit_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                amount: amount,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        await notifyAdmin();

        return res.status(200).json({ message: "Deposit processed successfully" });
    } catch (error) {
        console.error("Error logging in deposit:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
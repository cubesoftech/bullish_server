import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser, generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface ApplyForReferrerPointConversionPayload {
    amount: number;
}

export default async function applyForReferrerPointConversion(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { amount } = req.body as ApplyForReferrerPointConversionPayload;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." })
        }

        const hasPendingRequest = await prisma.referrer_point_conversion_log.findFirst({
            where: {
                userId: userInfo.id,
                status: "PENDING",
            }
        })
        if (hasPendingRequest) {
            return res.status(400).json({ message: "You already have a pending conversion request." });
        }

        if (amount > userInfo.referrerPoints) {
            return res.status(400).json({ message: "Insufficient referrer points." });
        }

        await prisma.referrer_point_conversion_log.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                amount: amount,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await notifyAdmin();

        return res.status(200).json({ message: "Referrer point conversion request submitted successfully." });
    } catch (error) {
        console.log("Error on user applyForReferrerPointConversion: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
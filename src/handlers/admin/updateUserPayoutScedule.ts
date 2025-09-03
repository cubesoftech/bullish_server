import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { series_payout_schedule } from "@prisma/client";

interface UpdateUserPayoutSchedulePayload {
    userId: string;
    payoutSchedule: string;
}

export default async function updateUserPayoutSchedule(req: Request, res: Response) {
    const { userId, payoutSchedule } = req.body as UpdateUserPayoutSchedulePayload;

    const acceptedPayoutSchedule: series_payout_schedule[] = ["WEEKLY", "MONTHLY", "QUARTERLY"];
    if (!userId || userId.trim() === "") {
        return res.status(400).json({ message: "Invalid user ID." });
    }
    if (!payoutSchedule || !acceptedPayoutSchedule.includes(payoutSchedule as series_payout_schedule)) {
        return res.status(400).json({ message: "Invalid payout schedule." });
    }

    try {
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        await prisma.users.update({
            where: {
                id: user.id
            },
            data: {
                payoutSchedule: payoutSchedule as series_payout_schedule,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "User payout schedule updated successfully." })
    } catch (error) {
        console.log("Error on updateUserPayoutSchedule: ", error)
        return res.status(500).json({ message: "Internal server error." })
    }
}
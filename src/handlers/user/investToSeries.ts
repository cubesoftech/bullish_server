import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";
import { series_payout_schedule } from "@prisma/client";

interface InvestToSeriesPayload {
    amount: number;
    seriesId: number;
    payoutSchedule: string;
    investmentDuration: number;
}

export default async function investToSeries(req: Request, res: Response) {
    const { user } = req;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, seriesId, payoutSchedule, investmentDuration } = req.body as InvestToSeriesPayload;
    const acceptedSchedules: series_payout_schedule[] = ["WEEKLY", "MONTHLY", "QUARTERLY"]
    const acceptedInvestmentDurations = [1, 3, 6, 12, 24, 36]; // in months

    // Validate required fields
    const validateFields = !(
        (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) ||
        (isNaN(seriesId) || !Number.isFinite(seriesId)) ||
        // update this too when series got changed
        (seriesId <= 0 || seriesId > 5) ||
        (!payoutSchedule || payoutSchedule.trim() === "" || !acceptedSchedules.includes(payoutSchedule as series_payout_schedule)) ||
        (isNaN(investmentDuration) || !Number.isFinite(investmentDuration) || investmentDuration <= 0 || !acceptedInvestmentDurations.includes(investmentDuration))
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Invalid investment parameters" });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(400).json({ message: "Invalid phone number or password" });
        }

        const series = await prisma.series.findFirst({
            where: {
                seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "Series not found" });
        }

        if (amount < series.minAmount) {
            return res.status(400).json({ message: `Minimum investment amount is ${series.minAmount}` });
        }

        await prisma.series_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                seriesId: series.id,
                amount,
                status: "PENDING",
                payoutSchedule: payoutSchedule as series_payout_schedule,
                investmentDuration,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        notifyAdmin();

        return res.status(200).json({ message: "Investment processed successfully" });
    } catch (e) {
        console.error("Error investing to series:", e);
        return res.status(500).json({ message: "Internal server error." });
    }
}
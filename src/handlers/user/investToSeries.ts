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
        return res.status(401).json({ message: "인증되지 않았습니다." });
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
        return res.status(400).json({ message: "잘못된 투자 매개변수입니다." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(400).json({ message: "잘못된 전화번호 또는 비밀번호입니다." });
        }

        const series = await prisma.series.findFirst({
            where: {
                seriesId
            }
        })
        if (!series) {
            return res.status(404).json({ message: "시리즈를 찾을 수 없습니다." });
        }

        if (amount < series.minAmount) {
            return res.status(400).json({ message: `최소 투자 금액은 ${series.minAmount.toLocaleString()} 입니다.` });
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

        await notifyAdmin();

        return res.status(200).json({ message: "투자가 성공적으로 처리되었습니다." });
    } catch (e) {
        console.error("Error investing to series:", e);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
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
        return res.status(400).json({ message: "잘못된 사용자 ID입니다." });
    }
    if (!payoutSchedule || !acceptedPayoutSchedule.includes(payoutSchedule as series_payout_schedule)) {
        return res.status(400).json({ message: "잘못된 지급 일정입니다." });
    }

    try {
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
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

        return res.status(200).json({ message: "사용자 지급 일정이 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateUserPayoutSchedule: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
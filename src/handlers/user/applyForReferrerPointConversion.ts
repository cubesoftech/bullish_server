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
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }
    const { amount } = req.body as ApplyForReferrerPointConversionPayload;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "잘못된 금액입니다." });
    }

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const hasPendingRequest = await prisma.referrer_point_conversion_log.findFirst({
            where: {
                userId: userInfo.id,
                status: "PENDING",
            }
        })
        if (hasPendingRequest) {
            return res.status(400).json({ message: "이미 대기 중인 전환 요청이 있습니다." });
        }

        if (amount > userInfo.referrerPoints) {
            return res.status(400).json({ message: "추천인 포인트가 부족합니다." });
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

        return res.status(200).json({ message: "추천인 포인트 전환 요청이 성공적으로 제출되었습니다." });
    } catch (error) {
        console.log("Error on user applyForReferrerPointConversion: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
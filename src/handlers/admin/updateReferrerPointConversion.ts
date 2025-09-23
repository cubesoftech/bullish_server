import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateReferrerPointConversionPayload {
    id: string;
    status: string;
}

export default async function updateReferrerPointConversion(req: Request, res: Response) {
    const { id, status } = req.body as UpdateReferrerPointConversionPayload;

    const acceptedStatuses = ["COMPLETED", "PENDING", "FAILED"];
    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "잘못되었거나 누락된 ID입니다." });
    }

    if (!status || !acceptedStatuses.includes(status)) {
        return res.status(400).json({ message: "잘못되었거나 누락된 상태입니다." });
    }

    try {
        const log = await prisma.referrer_point_conversion_log.update({
            where: {
                id,
            },
            data: {
                status: status as any,
                updatedAt: new Date()
            }
        });

        if (status === "COMPLETED") {
            await prisma.users.update({
                where: {
                    id: log.userId
                },
                data: {
                    referrerPoints: {
                        decrement: log.amount
                    },
                    balance: {
                        increment: log.amount
                    },
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "추천인 포인트 전환 로그 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating referrer_point_conversion_log status:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
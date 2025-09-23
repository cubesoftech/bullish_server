import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { distributeMonthlyReferrerRewardQueueUpsertJobScheduler } from "../../services/distributeMonthyReferrerReward";

interface ApproveUserRequestPayload {
    ids: string[];
}

export default async function approveUserRequest(req: Request, res: Response) {
    const { ids } = req.body as ApproveUserRequestPayload;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "사용자 ID가 제공되지 않았습니다." });
    }

    try {
        await prisma.users.updateMany({
            where: {
                id: {
                    in: ids
                }
            },
            data: {
                status: true
            }
        });

        return res.status(200).json({ message: "사용자가 성공적으로 승인되었습니다." });
    } catch (error) {
        console.error("Error approving users:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
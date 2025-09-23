import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateTransactionStatusPayload {
    id: string;
    status: string;
}

export default async function updateDepositRequestStatus(req: Request, res: Response) {
    const { id, status } = req.body as UpdateTransactionStatusPayload;

    const acceptedStatuses = ["COMPLETED", "PENDING", "FAILED"];
    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "잘못되었거나 누락된 ID입니다." });
    }

    if (!status || !acceptedStatuses.includes(status)) {
        return res.status(400).json({ message: "잘못되었거나 누락된 상태입니다." });
    }

    try {
        const request = await prisma.deposit_log.update({
            where: {
                id,
            },
            data: {
                status: status as any,
                updatedAt: new Date()
            }
        });

        // if (status === "COMPLETED") {
        //     await prisma.users.update({
        //         where: {
        //             id: request.userId
        //         },
        //         data: {
        //             balance: {
        //                 increment: request.amount,
        //             },
        //             updatedAt: new Date()
        //         }
        //     })
        // }

        return res.status(200).json({ message: "입금 상태가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.error("Error updating deposit status:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
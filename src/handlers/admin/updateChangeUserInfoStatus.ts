import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";

interface UpdateChangeUserInfoStatusPayload {
    logId: string;
    status: string;
}

export default async function updateChangeUserInfoStatus(req: Request, res: Response) {
    const { logId, status } = req.body as UpdateChangeUserInfoStatusPayload;

    const acceptedStatus: transaction_status[] = ["COMPLETED", "FAILED"];
    if (!logId || logId.trim() === "") {
        return res.status(400).json({ message: "잘못된 로그 ID입니다." });
    }

    if (!status || !acceptedStatus.includes(status as transaction_status)) {
        return res.status(400).json({ message: "잘못된 상태입니다." });
    }

    try {
        const log = await prisma.user_change_info_log.findUnique({
            where: {
                id: logId,
                status: "PENDING",
            }
        })
        if (!log) {
            return res.status(404).json({ message: "로그를 찾을 수 없거나 이미 처리되었습니다." });
        }

        const user = await prisma.users.findUnique({
            where: {
                id: log.userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        await prisma.user_change_info_log.update({
            where: {
                id: log.id
            },
            data: {
                status: status as transaction_status,
                updatedAt: new Date(),
            }
        })

        if (status === "COMPLETED") {
            await prisma.users.update({
                where: {
                    id: user.id
                },
                data: {
                    bank: log.bank,
                    accountHolder: log.accountHolder,
                    accountNumber: log.accountNumber,
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "User info change 요청이 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.log("Error on updateChangeUserInfoStatus: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
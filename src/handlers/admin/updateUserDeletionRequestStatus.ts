import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { transaction_status } from "@prisma/client";

interface UpdateUserDeletionRequestStatusPayload {
    id: string;
    status: string;
}

export default async function updateUserDeletionRequestStatus(req: Request, res: Response) {
    const { id, status } = req.body as UpdateUserDeletionRequestStatusPayload
    const acceptedStatus: transaction_status[] = ["COMPLETED", "FAILED"]
    if (!id || id.trim() === "") {
        return res.status(400).json({ message: "잘못된 ID입니다." })
    }
    if (!status || status.trim() === "" || !acceptedStatus.includes(status as transaction_status)) {
        return res.status(400).json({ message: "잘못된 상태입니다." })
    }

    try {
        const request = await prisma.user_deletion_request.findFirst({
            where: {
                id
            }
        })
        if (!request) {
            return res.status(404).json({ message: "요청을 찾을 수 없습니다." })
        }

        await prisma.user_deletion_request.update({
            where: {
                id: request.id
            },
            data: {
                status: status as transaction_status,
                updatedAt: new Date(),
            }
        })

        if (status === "COMPLETED") {
            await prisma.$transaction(async (tx) => {
                await tx.users.update({
                    where: {
                        id: request.userId
                    },
                    data: {
                        isDeleted: true,
                        updatedAt: new Date(),
                    }
                })
                await tx.investment_log.updateMany({
                    where: {
                        userId: request.userId,
                        status: "PENDING"
                    },
                    data: {
                        status: "FAILED", //failed due to account deletion
                        updatedAt: new Date(),
                    }
                })
            })
        }

        return res.status(200).json({ message: "요청 상태가 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on admin updateUserDeletionRequestStatus: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
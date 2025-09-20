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
        return res.status(400).json({ message: "Invalid log ID." });
    }

    if (!status || !acceptedStatus.includes(status as transaction_status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    try {
        const log = await prisma.user_change_info_log.findUnique({
            where: {
                id: logId,
                status: "PENDING",
            }
        })
        if (!log) {
            return res.status(404).json({ message: "Log not found or already processed." });
        }

        const user = await prisma.users.findUnique({
            where: {
                id: log.userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found." });
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

        return res.status(200).json({ message: "User info change request updated successfully." });
    } catch (error) {
        console.log("Error on updateChangeUserInfoStatus: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
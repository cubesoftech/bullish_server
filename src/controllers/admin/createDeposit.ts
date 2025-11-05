import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_role } from "@prisma/client"
import { generateRandomStringV2 } from "../../helpers";

interface CreateDepositPayload {
    amount: number;
    membersID: string;
    memberRole: string;
}

export default async function createDeposit(req: Request, res: Response, next: NextFunction) {
    const { amount, membersID, memberRole } = req.body as CreateDepositPayload
    const acceptedRoles: members_role[] = ["USER", "AGENT", "MASTER_AGENT", "ADMIN"]

    if (
        amount === undefined || amount < 0
        || !membersID || membersID.trim() === ""
        || !memberRole || !acceptedRoles.includes(memberRole as members_role)
    ) {
        return next({
            status: 400,
            message: "Invalid payload"
        })
    }

    try {
        await prisma.agents_withdrawals.create({
            data: {
                id: generateRandomStringV2(),
                amount,
                role: memberRole as members_role,
                status: "pending",
                membersId: membersID,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "Withdrawal request created successfully." })
    } catch (error) {
        console.log("Error admin | createDeposit: ", error)
        return next()
    }
}
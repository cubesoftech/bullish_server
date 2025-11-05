import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_role } from "@prisma/client";

interface GetAgentWithdrawalsPayload {
    membersId: string;
    role: string;
}

export default async function getAgentWithdrawals(req: Request, res: Response, next: NextFunction) {
    const { membersId, role } = req.body as GetAgentWithdrawalsPayload;
    const acceptedRoles: members_role[] = ["ADMIN", "AGENT", "MASTER_AGENT"]

    if (!membersId || membersId.trim() === "" || !role || role.trim() === "") {
        return next({
            status: 400,
            message: "Invalid membersId or role."
        })
    }
    if (!acceptedRoles.includes(role as members_role)) {
        return next({
            status: 400,
            message: "Invalid role."
        })
    }

    try {
        if (role === "ADMIN") {
            const withdrawals = await prisma.agents_withdrawals.findMany({
                include: {
                    members: {
                        select: {
                            email: true
                        }
                    }
                }
            })

            return res.status(200).json({ data: withdrawals })
        }

        const withdrawals = await prisma.agents_withdrawals.findMany({
            where: {
                membersId: membersId,
                role: role as members_role
            },
            include: {
                members: {
                    select: {
                        email: true
                    }
                }
            }
        })

        return res.status(200).json({ data: withdrawals })
    } catch (error) {
        console.log("Error admin | getAgentWithdrawals: ", error)
        return next();
    }
}
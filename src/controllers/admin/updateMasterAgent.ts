import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateMasterAgentPayload {
    masterAgentId: string;
    membersId: string;
    password: string;
    royalty: number;
}

export default async function updateMasterAgent(req: Request, res: Response, next: NextFunction) {
    const { masterAgentId, membersId, password, royalty } = req.body as UpdateMasterAgentPayload;
    if (
        !masterAgentId || masterAgentId.trim() === "" ||
        !membersId || membersId.trim() === "" ||
        !password || password.trim() === "" ||
        typeof royalty !== 'number'
    ) {
        return next({
            status: 400,
            message: "Invalid input data."
        })
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.members.update({
                where: {
                    id: membersId
                },
                data: {
                    password,
                    confirmpassword: password,
                }
            })
            await tx.masteragents.update({
                where: {
                    id: masterAgentId
                },
                data: {
                    royalty
                }
            })
        })

        return res.status(200).json({ message: "Master agent updated successfully." })
    } catch (error) {
        console.log("Error admin | updateMasterAgent:", error);
        return next()
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateMasterAgentStatusPayload {
    masterAgentId: string;
    status: boolean;
}

export default async function updateMasterAgentStatus(req: Request, res: Response, next: NextFunction) {
    const { masterAgentId, status } = req.body as UpdateMasterAgentStatusPayload;

    if (!masterAgentId || masterAgentId.trim() === "" || typeof status !== 'boolean') {
        return next({
            status: 400,
            message: "Invalid masterAgentId or status."
        });
    }

    try {
        const masterAgent = await prisma.members.findFirst({
            where: {
                id: masterAgentId,
            }
        })
        if (!masterAgent) {
            return next({
                status: 404,
                message: "Master agent not found."
            })
        }

        await prisma.members.update({
            where: {
                id: masterAgent.id,
            },
            data: {
                status
            }
        })

        return res.status(200).json({
            message: "Master agent status updated successfully."
        })
    } catch (error) {
        console.log("Error admin | updateMasterAgentStatus:", error);
        return next();
    }
}
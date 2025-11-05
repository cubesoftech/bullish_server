import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface DeleteMasterAgentPayload {
    masterAgentId: string
}

export default async function deleteMasterAgent(req: Request, res: Response, next: NextFunction) {
    const { masterAgentId } = req.body as DeleteMasterAgentPayload

    if (!masterAgentId || masterAgentId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid master agent id."
        })
    }

    try {
        const masterAgent = await prisma.masteragents.findUnique({
            where: {
                id: masterAgentId
            }
        })
        if (!masterAgent) {
            return next({
                status: 404,
                message: "Master agent not found."
            })
        }

        await prisma.members.delete({
            where: {
                id: masterAgent.id
            }
        })

        return res.status(200).json({ message: "Master agent deleted successfully." })
    } catch (error) {
        console.log("Error admin | deleteMasterAgent: ", error)
        return next();
    }
}
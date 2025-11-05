import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

export default async function getMasterAgents(req: Request, res: Response, next: NextFunction) {
    try {
        const masterAgents = await prisma.masteragents.findMany({
            include: {
                agents: {
                    include: {
                        members: true
                    }
                }
            }
        })

        const processedMasterAgents = await Promise.all(
            masterAgents.map(async (masterAgent) => {
                const { memberId, agents } = masterAgent
                const member = await prisma.members.findFirst({
                    where: {
                        id: memberId
                    }
                })

                const processedAgents = await Promise.all(
                    agents.map(async (agent) => {
                        const { memberId } = agent
                        const member = await prisma.members.findFirst({
                            where: {
                                id: memberId
                            }
                        })

                        return {
                            ...agent,
                            member
                        }
                    })
                );

                return {
                    ...masterAgent,
                    agents: processedAgents,
                    member
                }
            })
        )

        return res.status(200).json({
            masteragents: processedMasterAgents
        })
    } catch (error) {
        console.log("Error admin | getMasterAgents: ", error)
        return next();
    }
}
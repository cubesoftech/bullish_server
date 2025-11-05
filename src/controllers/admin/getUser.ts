import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_role } from "@prisma/client";

export default async function getUser(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }
    const { limit, page, role, id } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    const processedRole = role ? role as string : "ADMIN"
    const processedId = id ? id as string : user.id

    const acceptedRoles: members_role[] = ["ADMIN", "AGENT", "MASTER_AGENT"]

    if (!acceptedRoles.includes(processedRole as members_role)) {
        return next({
            status: 400,
            message: "Invalid role"
        })
    }

    try {
        // IF THE ROLE IS AGENT
        if (processedRole === "AGENT") {
            const agents = await prisma.agents.findFirst({
                where: {
                    memberId: processedId
                }
            })
            if (!agents) {
                return res.status(200).json({
                    users: [],
                    hasMore: false,
                })
            }

            const users = await prisma.members.findMany({
                where: {
                    role: "USER",
                    agentsId: agents.id
                },
                include: {
                    agents: {
                        select: {
                            masteragents: {
                                select: {
                                    memberId: true
                                }
                            },
                            memberId: true,
                        }
                    }
                },
                take: processedLimit + 1,
                skip: (processedPage - 1) * processedLimit,
            })

            const processedUsers = await Promise.all(
                users.map(async (user) => {
                    const { agents } = user

                    let agentId = undefined;
                    let masterAgentId = undefined;

                    if (agents) {
                        const { masteragents, memberId } = agents
                        const agent = await prisma.members.findFirst({
                            where: {
                                id: memberId
                            }
                        })
                        agentId = agent?.email

                        if (masteragents) {
                            const { memberId } = masteragents
                            const memberAgent = await prisma.members.findFirst({
                                where: {
                                    id: memberId
                                }
                            })
                            masterAgentId = memberAgent?.email
                        }
                    }

                    return {
                        ...user,
                        agentID: agentId,
                        masteragentID: masterAgentId
                    }
                })
            )

            let hasMore = false;

            if (users.length > processedLimit) {
                hasMore = true;
            }

            return res.status(200).json({
                users: processedUsers.slice(0, processedLimit),
                hasMore
            })
        }

        // IF THE ROLE IS MASTER AGENT
        if (processedRole === "MASTER_AGENT") {
            const masterAgent = await prisma.masteragents.findFirst({
                where: {
                    memberId: processedId
                }
            })
            if (!masterAgent) {
                return res.status(200).json({
                    users: [],
                    hasMore: false,
                })
            }

            const users = await prisma.members.findMany({
                where: {
                    role: "USER",
                    agents: {
                        masteragentsId: masterAgent.id
                    }
                },
                include: {
                    agents: {
                        select: {
                            masteragents: {
                                select: {
                                    memberId: true
                                }
                            },
                            memberId: true
                        }
                    }
                },
                take: processedLimit + 1,
                skip: (processedPage - 1) * processedLimit,
            })

            const processedUsers = await Promise.all(
                users.map(async (user) => {
                    const { agents } = user

                    let agentId = undefined;
                    let masterAgentId = undefined;

                    if (agents) {
                        const { masteragents, memberId } = agents
                        const agent = await prisma.members.findFirst({
                            where: {
                                id: memberId
                            }
                        })
                        agentId = agent?.email

                        if (masteragents) {
                            const { memberId } = masteragents
                            const memberAgent = await prisma.members.findFirst({
                                where: {
                                    id: memberId
                                }
                            })
                            masterAgentId = memberAgent?.email
                        }
                    }

                    return {
                        ...user,
                        agentID: agentId,
                        masteragentID: masterAgentId
                    }
                })
            )

            let hasMore = false;

            if (users.length > processedLimit) {
                hasMore = true;
            }

            return res.status(200).json({
                users: processedUsers.slice(0, processedLimit),
                hasMore
            })
        }

        // IF THE ROLE IS ADMIN
        const users = await prisma.members.findMany({
            where: {
                role: "USER"
            },
            include: {
                agents: {
                    select: {
                        masteragents: {
                            select: {
                                memberId: true,
                            },
                        },
                        memberId: true,
                    },
                },
            },
            take: processedLimit + 1,
            skip: (processedPage - 1) * processedLimit,
        })
        const processedUsers = await Promise.all(
            users.map(async (user) => {
                const { agents } = user

                let agentId = undefined;
                let masterAgentId = undefined;

                if (agents) {
                    const { masteragents, memberId } = agents
                    const agent = await prisma.members.findFirst({
                        where: {
                            id: memberId
                        }
                    })
                    agentId = agent?.email

                    if (masteragents) {
                        const { memberId } = masteragents
                        const memberAgent = await prisma.members.findFirst({
                            where: {
                                id: memberId
                            }
                        })
                        masterAgentId = memberAgent?.email
                    }
                }

                return {
                    ...user,
                    agentID: agentId,
                    masteragentID: masterAgentId
                }
            })
        )

        let hasMore = false;
        if (users.length > processedLimit) {
            hasMore = true;
        }

        return res.status(200).json({
            users: processedUsers.slice(0, processedLimit),
            hasMore
        })
    } catch (error) {
        console.log("Error admin | getUser: ", error)
        return next()
    }
}
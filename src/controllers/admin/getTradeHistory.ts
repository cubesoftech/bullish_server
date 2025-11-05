import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { members_role } from "@prisma/client";

export default async function getTradeHistory(req: Request, res: Response, next: NextFunction) {
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

    const acceptedRoles: members_role[] = ["ADMIN", "AGENT", "MASTER_AGENT", "USER"]

    if (!acceptedRoles.includes(processedRole as members_role)) {
        return next({
            status: 400,
            message: "Invalid role"
        })
    }

    try {

        // IF THE ROLE IS AGENT
        if (role === "AGENT") {
            const agent = await prisma.agents.findFirst({
                where: {
                    memberId: processedId
                }
            });

            if (!agent) {
                return res.status(200).json({
                    orderHistory: [],
                    hasMore: false,
                })
            };

            const orderHistory = await prisma.membertrades.findMany({
                where: {
                    members: {
                        referrer: agent.referralCode
                    }
                },
                include: {
                    members: true,
                },
                orderBy: {
                    timeExecuted: "desc"
                },
                take: processedLimit + 1,
                skip: (processedPage - 1) * processedLimit,
            })

            let hasMore = false;

            if (orderHistory.length > processedLimit) {
                hasMore = true;
            }

            return res.status(200).json({
                orderHistory: orderHistory.slice(0, processedLimit),
                hasMore,
            })
        }

        // IF THE ROLE IS MASTER AGENT
        if (role === "MASTER_AGENT") {
            const masterAgent = await prisma.masteragents.findFirst({
                where: {
                    memberId: processedId
                }
            })
            if (!masterAgent) {
                return res.status(200).json({
                    orderHistory: [],
                    hasMore: false,
                })
            }

            const agents = await prisma.agents.findMany({
                where: {
                    masteragentsId: masterAgent.id
                }
            })

            const referralCodes = agents.map(agent => agent.referralCode);

            const orderHistory = await prisma.membertrades.findMany({
                where: {
                    members: {
                        referrer: {
                            in: referralCodes
                        }
                    }
                },
                include: {
                    members: true
                },
                orderBy: {
                    timeExecuted: "desc"
                },
                take: processedLimit + 1,
                skip: (processedPage - 1) * processedLimit,
            })

            let hasMore = false;

            if (orderHistory.length > processedLimit) {
                hasMore = true;
            }

            return res.status(200).json({
                orderHistory: orderHistory.slice(0, processedLimit),
                hasMore,
            })
        }


        // IF THE ROLE IS ADMIN
        const orderHistory = await prisma.membertrades.findMany({
            include: {
                members: true,
            },
            orderBy: {
                timeExecuted: "desc"
            },
            take: processedLimit + 1,
            skip: (processedPage - 1) * processedLimit,
        })

        let hasMore = false;

        if (orderHistory.length > processedLimit) {
            hasMore = true;
        }

        return res.status(200).json({
            orderHistory: orderHistory.slice(0, processedLimit),
            hasMore,
        })
    } catch (error) {
        console.log("Error admin | getTradeHistory:", error);
        return next()
    }
}
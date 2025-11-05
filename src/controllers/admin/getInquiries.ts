import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

export default async function getInquiries(req: Request, res: Response, next: NextFunction) {
    const { limit, page, search, filter } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    const processedFilter = filter ? filter as string : "all"

    const acceptedFilters = ["all", "deposit"]

    if (!acceptedFilters.includes(processedFilter)) {
        return next({
            status: 400,
            message: "Invalid filter value"
        })
    }

    let where: Prisma.inquiriesWhereInput = {}

    if (processedFilter === "deposit") {
        where = {
            ...where,
            title: "입금계좌문의"
        }
    }

    if (search) {
        where = {
            ...where,
            members: {
                name: {
                    contains: search as string
                }
            }
        }
    }

    try {
        const inquiries = await prisma.inquiries.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit + 1,
            orderBy: {
                createdAt: 'desc'
            },
        })

        const processedInquiries = await Promise.all(
            inquiries.map(async (inquiry) => {
                const { memberId } = inquiry

                let agentId = undefined;
                let masterAgentId = undefined;

                const member = await prisma.members.findFirst({
                    where: {
                        id: memberId
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
                    }
                })

                if (!member) return;

                const { agents } = member

                if (agents) {
                    const { masteragents, memberId } = agents
                    const agent = await prisma.members.findFirst({
                        where: {
                            id: memberId
                        }
                    });

                    agentId = agent?.email

                    if (masteragents) {
                        const { memberId } = masteragents
                        const masterAgent = await prisma.members.findFirst({
                            where: {
                                id: memberId
                            }
                        });

                        masterAgentId = masterAgent?.email
                    }

                }

                return {
                    ...inquiry,
                    member,
                    agentID: agentId,
                    masterAgentID: masterAgentId
                }
            })
        )

        let hasMore = false;
        if (inquiries.length > processedLimit) {
            hasMore = true;
        }

        return res.status(200).json({
            inquries: processedInquiries.slice(0, processedLimit),
            hasMore
        })
    } catch (error) {
        console.log("Error admin | getInquiries:", error);
        return next()
    }
}
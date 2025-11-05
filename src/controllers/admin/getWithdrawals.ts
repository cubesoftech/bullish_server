import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

export default async function getWithdrawals(req: Request, res: Response, next: NextFunction) {
    const { limit, page, search, startDate, endDate } = req.query;

    const processedLimit = parseInt(limit as string) || 25
    const processedPage = parseInt(page as string) || 1
    const processedStartDate = startDate ? new Date(startDate as string) : null
    const processedEndDate = endDate ? new Date(endDate as string) : null

    let where: Prisma.transactionWhereInput = {
        type: "withdrawal",
        createdAt: {
            gte: startOfDay(processedStartDate || new Date()),
            lt: endOfDay(processedEndDate || new Date()),
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
        const withdrawals = await prisma.transaction.findMany({
            where,
            include: {
                members: true
            },
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit + 1,
            orderBy: {
                createdAt: 'desc'
            },
        })

        const processedWithdrawals = await Promise.all(
            withdrawals.map(async (withdrawal) => {
                const { members } = withdrawal
                const { agentsId } = members

                let agentId = undefined;
                let masterAgentId = undefined;

                if (agentsId) {

                    const agent = await prisma.agents.findFirst({
                        where: {
                            id: agentsId
                        }
                    })
                    const agentOnMemberTable = await prisma.members.findFirst({
                        where: {
                            id: agent?.memberId
                        }
                    })

                    agentId = agentOnMemberTable?.email

                    if (agent?.masteragentsId) {

                        const masterAgentOnMemberTable = await prisma.members.findFirst({
                            where: {
                                id: agent.masteragentsId
                            }
                        })

                        masterAgentId = masterAgentOnMemberTable?.email
                    }
                }

                return {
                    ...withdrawal,
                    agentID: agentId,
                    masteragentID: masterAgentId
                }
            })
        )

        let hasMore = false;
        if (withdrawals.length > processedLimit) {
            hasMore = true;
        }

        return res.status(200).json({
            withdrawals: processedWithdrawals.slice(0, processedLimit),
            hasMore
        })
    } catch (error) {
        console.log("Error admin | getWithdrawals:", error);
        return next()
    }
}
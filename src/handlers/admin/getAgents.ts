import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getAgents(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.agentsWhereInput = {}

    if (search) {
        where = {
            OR: [
                {
                    name: {
                        contains: search as string,
                    }
                },
                {
                    id: {
                        contains: search as string,
                    }
                }
            ]
        }
    }
    try {
        const agents = await prisma.agents.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                referredUsers: true,
            }
        })
        const totalAgents = await prisma.agents.count({ where })

        const processedAgents = agents.map(agent => ({
            ...agent,
            referredUsers: agent.referredUsers.map(user => ({
                ...user,
                referrerPoints: Number(user.referrerPoints),
                baseSettlementRate: Number(user.baseSettlementRate) * 100,
            }))
        }))

        return res.status(200).json({ data: processedAgents, total: totalAgents });
    } catch (error) {
        console.error("Error fetching agents: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
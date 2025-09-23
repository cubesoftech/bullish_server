import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import { Prisma } from "@prisma/client";

export default async function getChangeUserInfoLog(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    // default parameters
    const processedPage = parseInt(page as string) || 1;
    const processedLimit = parseInt(limit as string) || 10;

    let where: Prisma.user_change_info_logWhereInput = {
        user: {
            isDeleted: false
        }
    };

    if (search) {
        where = {
            ...where,
            user: {
                name: {
                    contains: search as string
                }
            }
        }
    }

    try {
        const changeLogs = await prisma.user_change_info_log.findMany({
            where,
            skip: (processedPage - 1) * processedLimit,
            take: processedLimit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true,
            }
        })

        const processedDeletedUsers = changeLogs.map(logs => {
            return {
                ...logs,
                user: {
                    ...logs.user,
                    baseSettlementRate: logs.user.baseSettlementRate * 100, //convert from decimal to percent
                    referrerPoints: Number(logs.user.referrerPoints),
                }
            }
        })

        const totalDeletedUsers = await prisma.user_change_info_log.count({ where })

        console.log("processedDeletedUsers", processedDeletedUsers);

        return res.status(200).json({ data: processedDeletedUsers, total: totalDeletedUsers });
    } catch (error) {
        console.error("Error fetching series log: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
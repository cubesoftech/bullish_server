import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { series_log, users } from "@prisma/client";

export default async function createDummyUsers(req: Request, res: Response) {
    const ids = [
        "3e31277", "9b62c01", "8dde0ed", "664b339", "5ea2159", "e78960c", "a9db7f6", "80f7afb", "a242dbb", "1c3ee1b",
        "11ad89d", "ff9bda6", "c525e86", "2ebeee4", "7875472", "9f73cc1", "47c517c", "c5a16fe", "54b6551", "688490d",
        "add4772", "a6a8bf2", "6270266"
    ]
    try {
        const users = await prisma.users.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        const seriesData: series_log[] = users.map(user => ({
            id: generateRandomString(7),
            userId: user.id,
            seriesId: "i9pml4k",
            amount: 1_000_000,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
        }))

        const series = await prisma.series_log.createMany({
            data: seriesData
        })
        return res.status(200).json({ data: series });
    } catch (error) {
        console.error("Error creating dummy users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
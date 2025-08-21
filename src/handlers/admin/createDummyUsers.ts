import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { series_log, users } from "@prisma/client";

export default async function createDummyUsers(req: Request, res: Response) {
    const ids = [
        "0173e6a", "047d689", "0b49e5e", "0d1598d", "124dbf0", "173fe1a", "2298767", "27f45ab", "29fed16", "35dc037",
        "4dba989", "6f63cc7", "769d5fd", "7c02c5c", "82ea20b", "88903b9", "88a5ce8", "89c28b0", "8c7a4ca", "9b8fe47",
        "a278323", "a9167fb", "b0b40dd"
    ]
    try {
        const datas: series_log[] = ids.map(id => {
            return {
                id: generateRandomString(7),
                userId: id,
                seriesId: "i9pml4k",
                amount: 1_000_000,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        await prisma.series_log.createMany({
            data: datas
        })
        return res.status(200).json({ message: "Dummy users created successfully" });
    } catch (error) {
        console.error("Error creating dummy users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
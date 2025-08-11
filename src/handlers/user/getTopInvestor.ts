import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getTopInvestor(req: Request, res: Response) {
    try {
        const topInvestor = await prisma.series_log.findFirst({
            orderBy: {
                amount: "desc",
            },
            include: {
                series: true,
                user: true,
            },
            take: 10,
        });
        return res.status(200).json({ data: topInvestor });
    } catch (error) {
        console.error("Error fetching top investor:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
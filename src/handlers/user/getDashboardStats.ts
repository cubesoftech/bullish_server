import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import findUser from "../../utils/findUser";

export default async function getDashboardStats(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized." })
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found." });
        }

        const totalInvestments = await prisma.series_log.aggregate({
            where: {
                userId: user.id,
                status: {
                    not: "FAILED"
                },
            },
            _sum: {
                amount: true
            }
        });

        const data = {
            totalInvestments
        }

        return res.status(200).json({ data })
    } catch (error) {
        console.log("Error on getDashboardStats: ", error)
        return res.status(500).json({ message: "Internal server error." });
    }
}
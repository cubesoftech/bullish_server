import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface GetUserDetailsPayload {
    userId: string
}

export default async function getUserDetails(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.body as GetUserDetailsPayload;

    if (!userId || userId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid user id."
        });
    }

    try {
        const user = await prisma.members.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        const [memberTrades, transactions] = await Promise.all([
            await prisma.membertrades.findMany({
                where: {
                    membersId: user.id
                },
                orderBy: {
                    timeExecuted: "desc"
                }
            }),
            await prisma.transaction.findMany({
                where: {
                    membersId: user.id
                },
                orderBy: {
                    createdAt: "desc"
                }
            })
        ])

        return res.status(200).json({
            member: user,
            recentrades: memberTrades,
            tansactions: transactions
        })
    } catch (error) {
        console.log("Error admin | getUserDetails: ", error);
        return next();
    }
}
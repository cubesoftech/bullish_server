import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";

export default async function getBalance(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    try {
        const member = await getUserData({
            userId: user.id,
            select: {
                balance: true
            }
        })

        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        return res.status(200).json({
            balance: member.balance
        })
    } catch (error) {
        console.log("Error user | getBalance:", error);
        return next()
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomString, getUserData } from "../../helpers";

export default async function logout(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const now = new Date()

    try {
        const member = await getUserData({
            userId: user.id,
            select: {
                id: true
            }
        })
        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        await prisma.member_login_logs.upsert({
            where: {
                membersID: member.id
            },
            update: {
                lastSignOut: now,
            },
            create: {
                id: generateRandomString(7),
                membersID: member.id,
                lastSignOut: now,
            }
        })

        return res.status(200).json({
            message: "Logged out successfully."
        })
    } catch (error) {
        console.log("Error user | logout:", error);
        return next()
    }
}
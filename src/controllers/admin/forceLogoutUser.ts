import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface ForceLogoutUserPayload {
    userId: string;
    forceLogout: boolean;
}

export default async function forceLogoutUser(req: Request, res: Response, next: NextFunction) {
    const { userId, forceLogout } = req.body as ForceLogoutUserPayload;

    if (!userId || userId.trim() === "" || forceLogout === undefined) {
        return next({
            status: 400,
            message: "Invalid userId or forceLogout value."
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

        await prisma.members.update({
            where: {
                id: user.id
            },
            data: {
                force: forceLogout
            }
        })

        return res.status(200).json({ message: "User forced logout" })
    } catch (error) {
        console.log("Error admin | forceLogoutUser:", error);
        return next()
    }
}
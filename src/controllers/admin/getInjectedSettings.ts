import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface GetInjectedSettingsPayload {
    userId: string
}

export default async function getInjectedSettings(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.body as GetInjectedSettingsPayload;

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

        const settings = await prisma.inject_setting.findFirst({
            where: {
                userId: user.id
            }
        })
        if (!settings) {
            return next({
                status: 404,
                message: "Injected settings not found."
            })
        }

        return res.status(200).json({ data: settings })
    } catch (error) {
        console.log("Error admin | getInjectedSettings: ", error);
        return next();
    }
}
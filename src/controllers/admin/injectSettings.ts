import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface InjectSettingsPayload {
    settingsId?: string;
    userId: string;
    multiplier: number;
    status: boolean;
}

export default async function injectSettings(req: Request, res: Response, next: NextFunction) {
    const { settingsId, userId, multiplier, status } = req.body as InjectSettingsPayload;

    if (!userId || userId.trim() === "" || multiplier === undefined || status === undefined) {
        return next({
            status: 400,
            message: "Invalid settingsId, userId, multiplier or status."
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

        if (settingsId) {
            const settings = await prisma.inject_setting.findUnique({
                where: {
                    id: settingsId
                }
            })
            if (!settings) {
                return next({
                    status: 400,
                    message: "Invalid settingsId."
                })
            }


            await prisma.inject_setting.update({
                where: {
                    id: settings.id
                },
                data: {
                    multiplier,
                    status,
                }
            })

            return res.status(200).json({ message: "Injected settings updated successfully." })
        }

        await prisma.inject_setting.create({
            data: {
                id: Math.random().toString(36).substring(7),
                userId: user.id,
                multiplier,
                status,
                createdAt: new Date()
            }
        })

        return res.status(200).json({ message: "Injected settings updated successfully." })
    } catch (error) {
        console.log("Error admin | injectSettings: ", error);
        return next();
    }
}
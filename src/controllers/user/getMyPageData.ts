import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";

export default async function getMyPageData(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    try {
        const memeber = await getUserData({
            userId: user.id
        });
        if (!memeber) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        return res.status(200).json({ user: memeber })
    } catch (error) {
        console.log("Error user | getMyPageData:", error);
        return next()
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

export default async function getGameSettings(req: Request, res: Response, next: NextFunction) {
    try {
        const site = await prisma.sitesettings.findFirst()

        if (!site) {
            return next({
                status: 404,
                message: "Site settings not found."
            })
        }

        return res.status(200).json({
            data: site
        })
    } catch (error) {
        console.log("Error user | getGameSettings:", error);
        return next()
    }
}
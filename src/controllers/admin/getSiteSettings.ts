import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

export default async function getSiteSettings(req: Request, res: Response, next: NextFunction) {
    try {
        const siteSettings = await prisma.sitesettings.findFirst()
        if (!siteSettings) {
            return next({
                status: 404,
                message: "Site settings not found"
            })
        }

        return res.status(200).json({ data: siteSettings })
    } catch (error) {
        console.log("Error admin | getSiteSettings: ", error)
        return next()
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateSiteSettingsPayload {
    returnOnWin: number;
    oneMinLock: number;
    threeMinLock: number;
    fiveMinLock: number;
    eurusd: boolean;
    gold: boolean;
    nasdaq: boolean;
    nvda: boolean;
    pltr: boolean;
    tsla: boolean;
    minimumAmount: number;
}

export default async function updateSiteSettings(req: Request, res: Response, next: NextFunction) {
    const { returnOnWin, oneMinLock, threeMinLock, fiveMinLock, eurusd, gold, nasdaq, nvda, pltr, tsla, minimumAmount } = req.body as UpdateSiteSettingsPayload;

    if (
        returnOnWin === undefined || returnOnWin < 0 ||
        oneMinLock === undefined || oneMinLock < 0 ||
        threeMinLock === undefined || threeMinLock < 0 ||
        fiveMinLock === undefined || fiveMinLock < 0 ||
        eurusd === undefined ||
        gold === undefined ||
        nasdaq === undefined ||
        nvda === undefined ||
        pltr === undefined ||
        tsla === undefined ||
        minimumAmount === undefined || minimumAmount < 0
    ) {
        return next({
            status: 400,
            message: "Invalid site settings data."
        });
    }

    try {
        const siteSettings = await prisma.sitesettings.findFirst();

        if (!siteSettings) {
            return next({
                status: 404,
                message: "Site settings not found."
            });
        }

        await prisma.sitesettings.update({
            where: {
                id: siteSettings.id
            },
            data: {
                returnOnWin,
                oneMinLock,
                threeMinLock,
                fiveMinLock,
                eurusd,
                gold,
                nasdaq,
                nvda,
                pltr,
                tsla,
                minimumAmount
            }
        })

        return res.status(200).json({ message: "Site settings updated successfully." });
    } catch (error) {
        console.log("Error admin | updateSiteSettings:", error);
        return next()
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import getDeviceInfo from "../../utils/getDeviceInfo";
import { generateRandomString } from "../../utils";
import { subDays } from "date-fns";

interface UpdateAnalyticsPayload {
    path: string;
}

export default async function updateAnalytics(req: Request, res: Response) {
    const { path } = req.body as UpdateAnalyticsPayload;
    const { ipAddress, device, referrer } = getDeviceInfo(req);
    try {
        const date = new Date()

        await prisma.analytics.create({
            data: {
                id: generateRandomString(7),
                path,
                referrer,
                ipAddress,
                device,
                createdAt: date,
                updatedAt: date,
            }
        })

        return res.status(200).json({ message: "성공" });
    } catch (error) {
        console.log("Error on updateAnalytics:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
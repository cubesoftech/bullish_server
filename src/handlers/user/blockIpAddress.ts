import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { addMinutes } from "date-fns";

export default async function blockIpAddress(req: Request, res: Response) {
    let ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress
    const now = new Date()

    if (ipAddress) {
        if (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "::ffff:127.0.0.1") {
            ipAddress = "localhost"
        }

        try {
            const ipBlockedRecord = await prisma.blocked_ip.findUnique({
                where: {
                    ipAddress: ipAddress
                }
            })
            if (ipBlockedRecord && ipBlockedRecord.blockedUntil > new Date()) {
                const minutesRemaining = Math.ceil((ipBlockedRecord.blockedUntil.getTime() - new Date().getTime()) / (60 * 1000));
                return res.status(400).json({ message: "너무 많은 로그인 시도. 잠시 후 다시 시도하세요.", data: minutesRemaining });
            }
            await prisma.blocked_ip.upsert({
                where: {
                    ipAddress: ipAddress
                },
                create: {
                    id: generateRandomString(7),
                    ipAddress,
                    blockedUntil: addMinutes(now, 10), //10 mins on production
                    // blockedUntil: addMinutes(now, 2), // use 2 mins for testing
                    createdAt: now,
                    updatedAt: now,
                },
                update: {
                    blockedUntil: addMinutes(now, 10), //10 mins on production
                    // blockedUntil: addMinutes(now, 2), // use 2 mins for testing
                    updatedAt: now,
                }
            })

            return res.status(200).json({ message: "IP 주소가 성공적으로 차단되었습니다." });
        } catch (error) {
            console.log("Error on blockIpAddress: ", error)
            return res.status(500).json({ message: "내부 서버 오류" });
        }
    } else {
        return res.sendStatus(200)
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";
import { generateRandomString } from "../../utils";

import getDeviceInfo from "../../utils/getDeviceInfo";

export default async function logout(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(400).json({ message: "사용자가 인증되지 않았습니다." });
    }

    const { ipAddress, device } = getDeviceInfo(req);

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLogout: new Date(),
                    lastDevice: device,
                    lastIpAddress: ipAddress ?? "Unknown IP Address",
                }
            });
            await tx.activity_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    ipAddress: ipAddress ?? "Unknown IP Address",
                    device,
                    activity: "LOGOUT",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        })

        return res.status(200).json({ message: "성공적으로 로그아웃되었습니다." });
    } catch (error) {
        console.error("Error during logout: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
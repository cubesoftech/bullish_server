import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function userInfo(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id
            }
        })

        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const processedUserInfo = {
            ...userInfo,
            referrerPoints: Number(userInfo.referrerPoints || 0)
        }

        return res.status(200).json({ data: processedUserInfo });
    } catch (error) {
        console.error("Error fetching user info:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
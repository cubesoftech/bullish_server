import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface MatchPhoneNumberPayload {
    phoneNumber: string;
}

export default async function matchPhoneNumber(req: Request, res: Response) {
    const { user } = req
    if (!user) return res.status(401).json({ message: "인증되지 않았습니다." })

    const { phoneNumber } = req.body as MatchPhoneNumberPayload;
    if (!phoneNumber || phoneNumber.trim() === "") {
        return res.status(400).json({ message: "전화번호는 필수입니다." });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id
            },
            select: {
                phoneNumber: true
            }
        })
        if (!userInfo) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })

        if (userInfo.phoneNumber !== phoneNumber) {
            return res.status(400).json({ message: "전화번호가 일치하지 않습니다." });
        }
        return res.status(200).json({ message: "전화번호가 일치합니다." });
    } catch (error) {
        console.error("Error getPhoneNumber:", error);
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
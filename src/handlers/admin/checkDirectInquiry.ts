import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function checkDirectionInquiry(req: Request, res: Response) {
    const { userId } = req.query
    if (!userId || (userId as string).trim() === "") {
        return res.status(400).json({ message: "잘못된 사용자 ID입니다." })
    }

    const processedUserId = userId as string
    try {
        const user = await prisma.users.findFirst({
            where: {
                id: processedUserId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." })
        }

        const hasDirectMessage = await prisma.direct_inquiry.count({
            where: {
                userId: processedUserId
            }
        })

        return res.status(200).json({ data: hasDirectMessage > 0 })
    } catch (error) {
        console.log("Error on admin checkDirectionInquiry:", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
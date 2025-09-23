import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser, generateRandomString } from "../../utils";

export default async function deleteAccount(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const hasPendingRequest = await prisma.user_deletion_request.count({
            where: {
                userId: userInfo.id,
                status: "PENDING"
            }
        })

        if (hasPendingRequest > 0) {
            return res.status(400).json({ message: "이미 대기 중인 요청이 있습니다." })
        }

        await prisma.user_deletion_request.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "사용자 계정 삭제 요청이 성공적으로 처리되었습니다." });
    } catch (error) {
        console.log("Error deleting user account: ", error)
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
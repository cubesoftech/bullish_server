import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { signAccessToken, signRefreshToken } from "../../utils/token";
import { admin } from "@prisma/client";
import { generateRandomString } from "../../utils";

interface LoginPayload {
    email: string;
    password: string;
}

export default async function login(req: Request, res: Response) {
    const body = req.body as LoginPayload;

    // Validate required fields
    const validateFields = !(
        body.email.trim() === ""
        || body.password.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
    }

    try {
        const admin = await prisma.admin.findFirst({
            where: {
                ...body,
                status: true,
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "잘못된 사용자 이름 또는 비밀번호입니다." });
        }

        await prisma.admin.update({
            where: {
                id: admin.id
            },
            data: {
                lastLogin: new Date(),
            }
        })

        const accessToken = signAccessToken({ id: admin.id })
        const refreshToken = signRefreshToken({ id: admin.id })

        await prisma.refresh_tokens.upsert({
            where: {
                adminId: admin.id
            },
            create: {
                id: generateRandomString(7),
                adminId: admin.id,
                token: refreshToken,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            update: {
                token: refreshToken,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({
            message: "로그인 성공.",
            data: {
                data: accessToken,
                data2: refreshToken,
                id: admin.id
            },
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
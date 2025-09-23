import { Request, Response } from "express";
import { getEnvirontmentVariable } from "../../utils";
import { AuthPayload } from "../../utils/interface";
import jwt from "jsonwebtoken"
import { signAccessToken, signRefreshToken } from "../../utils/token";
import { prisma } from "../../utils/prisma";

interface RefreshPayload {
    refreshToken: string;
}
export default async function refresh(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshPayload;
    if (!refreshToken || refreshToken.trim() === "") {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
        const secret = getEnvirontmentVariable("JWT_REFRESH_SECRET")
        const decoded = jwt.verify(refreshToken, secret) as AuthPayload;

        const isValid = await prisma.refresh_tokens.findFirst({
            where: {
                token: refreshToken,
                OR: [
                    {
                        adminId: decoded.id,
                    },
                    {
                        userId: decoded.id,
                    }
                ]
            }
        })
        if (!isValid) {
            return res.status(403).json({ message: "잘못되었거나 만료된 리프레시 토큰입니다." });
        }

        const newAccessToken = signAccessToken({ id: decoded.id });
        const newRefreshToken = signRefreshToken({ id: decoded.id });

        await prisma.refresh_tokens.update({
            where: {
                id: isValid.id
            },
            data: {
                token: newRefreshToken,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
import { Request, Response, NextFunction } from "express";
import { getEnvirontmentVariable } from "../../helpers";
import { AuthPayload } from "../../helpers/interfaces";
import jwt from "jsonwebtoken";
import { signAccessToken, signRefreshToken } from "../../helpers/token";
import prisma from "../../helpers/prisma";

interface RefreshTokenPayload {
    refreshToken: string;
}

export default async function refreshToken(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.body as RefreshTokenPayload;
    if (!refreshToken || refreshToken.trim() === "") {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
        const secret = getEnvirontmentVariable("JWT_REFRESH_SECRET")
        const decoded = jwt.verify(refreshToken, secret) as AuthPayload;

        const isValidToken = await prisma.refresh_tokens.findFirst({
            where: {
                memberId: decoded.id,
                token: refreshToken,
            }
        })
        if (!isValidToken) {
            return next({
                status: 401,
                message: "Invalid refresh token"
            })
        }

        const newAccessToken = signAccessToken({ id: decoded.id });
        const newRefreshToken = signRefreshToken({ id: decoded.id });

        await prisma.refresh_tokens.update({
            where: {
                memberId: decoded.id
            },
            data: {
                token: newRefreshToken,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({
            data: {
                data1: newAccessToken,
                data2: newRefreshToken
            }
        })
    } catch (error) {
        console.log("Error middleware | refreshToken:", error);
        return next({
            status: 500,
            message: "Internal server error"
        });
    }
}
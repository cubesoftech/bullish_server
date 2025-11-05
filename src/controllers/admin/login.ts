import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { signAccessToken } from "../../helpers/token";
import { signRefreshToken } from "../../helpers/token";
import { generateRandomString } from "../../helpers";

interface LoginPayload {
    email: string;
    password: string;
}

export default async function login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body as LoginPayload;

    if (!email || email.trim() === "" || !password || password.trim() === "") {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const now = new Date();
    try {
        const user = await prisma.members.findFirst({
            where: {
                email,
                password,
                status: true,
                role: {
                    not: "USER"
                }
            }
        })
        if (!user) {
            return next({
                status: 404,
                message: "User not found"
            })
        }

        const accessToken = signAccessToken({ id: user.id })
        const refreshToken = signRefreshToken({ id: user.id })

        await prisma.refresh_tokens.upsert({
            where: {
                memberId: user.id
            },
            create: {
                id: generateRandomString(7),
                token: refreshToken,
                memberId: user.id,
                createdAt: now,
                updatedAt: now,
            },
            update: {
                token: refreshToken,
                updatedAt: now,
            }
        })

        return res.status(200).json({
            message: "Login successfully.",
            data: {
                role: user.role,
                id: user.id,
                userId: user.email,
                data1: accessToken,
                data2: refreshToken,
            }
        })
    } catch (error) {
        console.log("Error admin | login:", error);
        return next()
    }
}
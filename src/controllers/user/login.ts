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

        await prisma.$transaction(async (tx) => {
            await tx.member_login_logs.upsert({
                where: {
                    membersID: user.id
                },
                update: {
                    lastSignIn: now,
                },
                create: {
                    id: generateRandomString(7),
                    membersID: user.id,
                    lastSignIn: now,
                }
            })
            await tx.refresh_tokens.upsert({
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
        })


        return res.status(200).json({
            message: "Login successfully.",
            data: {
                data1: accessToken,
                data2: refreshToken,
            }
        })
    } catch (error) {
        return next()
    }
}
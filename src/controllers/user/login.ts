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

        const loginLog = await prisma.member_login_logs.findFirst({
            where: {
                membersID: user.id,
            }
        })

        if (loginLog) {
            await prisma.member_login_logs.update({
                where: {
                    id: loginLog.id,
                },
                data: {
                    lastSignIn: new Date()
                }
            })
        } else {
            await prisma.member_login_logs.create({
                data: {
                    id: generateRandomString(7),
                    membersID: user.id,
                    lastSignIn: new Date(),
                }
            })
        }

        const accessToken = signAccessToken({ id: user.id })
        const refreshToken = signRefreshToken({ id: user.id })

        return res.status(200).json({
            message: "Login successfully.", data: {
                data1: accessToken,
                data2: refreshToken,
            }
        })
    } catch (error) {
        return next()
    }
}
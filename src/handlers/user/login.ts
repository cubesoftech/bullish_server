import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { signAccessToken, signRefreshToken } from "../../utils/token";
import { generateRandomString } from "../../utils";
import getDeviceInfo from "../../utils/getDeviceInfo";

interface LoginPayload {
    phoneNumber: string;
    password: string;
}

export default async function login(req: Request, res: Response) {
    const body = req.body as LoginPayload;

    const { ipAddress, device } = getDeviceInfo(req);

    // Validate required fields
    const validateFields = !(
        body.phoneNumber.trim() === ""
        || body.password.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
    }

    try {
        const blockedIpAddressRecord = await prisma.blocked_ip.findUnique({
            where: {
                ipAddress: ipAddress
            }
        })
        if (blockedIpAddressRecord && blockedIpAddressRecord.blockedUntil > new Date()) {
            const minutesRemaining = Math.ceil((blockedIpAddressRecord.blockedUntil.getTime() - new Date().getTime()) / (60 * 1000));
            return res.status(400).json({ message: "너무 많은 로그인 시도. 잠시 후 다시 시도하세요.", data: minutesRemaining });
        }

        const user = await prisma.users.findFirst({
            where: {
                ...body,
                status: true,
                isDeleted: false,
            },
            omit: {
                referrerPoints: true
            }
        })
        if (!user) {
            return res.status(400).json({ message: "잘못된 전화번호 또는 비밀번호입니다." });
        }

        const accessToken = signAccessToken({ id: user.id })
        const refreshToken = signRefreshToken({ id: user.id })

        await prisma.$transaction(async (tx: any) => {
            // update user's last login, device, and ip address
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLogin: new Date(),
                    lastDevice: device,
                    lastIpAddress: ipAddress ?? "Unknown IP Address",
                }
            });
            // log login activity
            await tx.activity_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    ipAddress: ipAddress ?? "Unknown IP Address",
                    device,
                    activity: "LOGIN",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            // create/update refresh token
            await tx.refresh_tokens.upsert({
                where: {
                    userId: user.id
                },
                create: {
                    id: generateRandomString(7),
                    userId: user.id,
                    token: refreshToken,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                update: {
                    token: refreshToken,
                    updatedAt: new Date(),
                }
            })
        })

        const unreadMessages = await prisma.direct_inquiry.count({
            where: {
                userId: user.id,
                isUserReplied: false,
            }
        })

        return res.status(200).json({
            message: "로그인 성공.",
            data: {
                ...user,
                data: accessToken,
                data2: refreshToken,
            },
            unreadMessages,
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
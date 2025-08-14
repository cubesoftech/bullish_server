import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { signAccessToken } from "../../utils/token";
import { generateRandomString } from "../../utils";

interface LoginUsingOtpPayload {
    phoneNumber: string;
    otp: string;
}

export default async function loginUsingOTP(req: Request, res: Response) {
    const { phoneNumber, otp } = req.body as LoginUsingOtpPayload;

    let ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress
    const device = req.headers['user-agent']?.toString() || "Unknown Device";

    if (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "::ffff:127.0.0.1") {
        ipAddress = "localhost"
    }

    if (
        (!phoneNumber || phoneNumber.trim() === "") ||
        (!otp || otp.trim() === "")
    ) {
        return res.status(400).json({ message: "Phone number and OTP are required." });
    }

    try {
        const user = await prisma.users.findFirst({
            where: {
                phoneNumber,
                status: true,
            },
            include: {
                otp: true,
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (!user.otp) {
            return res.status(400).json({ message: "OTP not found." });
        }

        if (otp === user.otp.otp && user.otp.expiresAt > new Date()) {
            const accessToken = signAccessToken({ id: user.id });
            const unreadMessages = await prisma.direct_inquiry.count({
                where: {
                    userId: user.id,
                    isUserReplied: false,
                }
            })

            await prisma.$transaction(async (tx: any) => {
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
            })

            return res.status(200).json({
                message: "Login successful",
                data: {
                    ...user,
                    data: accessToken
                },
                unreadMessages,
            });
        } else {
            return res.status(401).json({ message: "Invalid OTP." });
        }
    } catch (error) {
        console.log("Error on loginUsingOTP: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { signAccessToken } from "../../utils/token";
import { generateRandomString } from "../../utils";

interface LoginPayload {
    phoneNumber: string;
    password: string;
}

export default async function login(req: Request, res: Response) {
    const body = req.body as LoginPayload;

    let ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress
    const device = req.headers['user-agent']?.toString() || "Unknown Device";

    if (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "::ffff:127.0.0.1") {
        ipAddress = "localhost"
    }

    // Validate required fields
    const validateFields = !(
        body.phoneNumber.trim() === ""
        || body.password.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await prisma.users.findFirst({
            where: {
                ...body,
                status: true,
            },
            omit: {
                referrerPoints: true
            }
        })
        if (!user) {
            return res.status(400).json({ message: "Invalid phone number or password" });
        }

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

        const accessToken = signAccessToken({ id: user.id })
        const unreadMessages = await prisma.direct_inquiry.count({
            where: {
                userId: user.id,
                isUserReplied: false,
            }
        })

        return res.status(200).json({
            message: "Login successful",
            data: {
                ...user,
                data: accessToken,
            },
            unreadMessages,
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
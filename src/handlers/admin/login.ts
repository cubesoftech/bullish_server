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
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const admin = await prisma.admin.findFirst({
            where: {
                ...body,
                status: true,
            }
        })
        if (!admin) {
            return res.status(400).json({ message: "Invalid username or password" });
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
            message: "Login successful",
            data: {
                data: accessToken,
                data2: refreshToken,
                id: admin.id
            },
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
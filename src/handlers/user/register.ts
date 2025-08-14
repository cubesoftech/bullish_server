import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

interface RegisterPayload {
    phoneNumber: string;
    password: string;
    name: string;
    birthDate: string;
    gender: string;
    referralCode?: string;
}

export default async function register(req: Request, res: Response) {
    const { phoneNumber, password, name, birthDate, gender, referralCode } = req.body as RegisterPayload;

    // Validate required fields
    const validateFields = !(
        phoneNumber.trim() === ""
        || password.trim() === ""
        || name.trim() === ""
        || birthDate.trim() === ""
        || gender.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "All fields are required" });
    }


    try {
        const isExistingUser = await prisma.users.findFirst({
            where: {
                phoneNumber: phoneNumber
            }
        })
        if (isExistingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        // verify referral code if provided
        let referrer: any | null = null
        if (referralCode) {
            referrer = await prisma.users.findFirst({
                where: {
                    id: referralCode,
                    status: true,
                }
            })
            if (!referrer) {
                return res.status(400).json({ message: "Invalid referral code" });
            }
        }

        await prisma.users.create({
            data: {
                id: generateRandomString(7),
                phoneNumber,
                password,
                name,
                birthDate,
                gender,
                referrerId: referrer ? referrer.id : null,
                status: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: new Date(),
                lastLogout: new Date(),
                lastDevice: "",
            }
        });
        return res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
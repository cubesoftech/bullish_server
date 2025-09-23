import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface RegisterPayload {
    phoneNumber: string;
    password: string;
    name: string;
    birthDate: string;
    gender: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    email?: string;
    referralCode?: string;
}

export default async function register(req: Request, res: Response) {
    const { phoneNumber, password, name, birthDate, gender, bank, accountNumber, accountHolder, email, referralCode } = req.body as RegisterPayload;

    // Validate required fields
    const validateFields = !(
        phoneNumber.trim() === ""
        || password.trim() === ""
        || name.trim() === ""
        || birthDate.trim() === ""
        || gender.trim() === ""
        || bank.trim() === ""
        || accountNumber.trim() === ""
        || accountHolder.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "정보가 부족합니다." });
    }

    try {
        const isExistingUser = await prisma.users.findFirst({
            where: {
                phoneNumber: phoneNumber,
            }
        })
        if (isExistingUser) {
            res.status(400).json({ message: "이미 존재하는 사용자입니다." });
            return;
        }

        // verify referral code if provided
        let referrer: any | null = null
        let referrerType: "user" | "agent" | null = null
        if (referralCode) {
            const referrerUser = await prisma.users.findFirst({
                where: {
                    id: referralCode,
                    status: true,
                }
            })

            // assign referrer
            if (referrerUser) {
                referrer = referrerUser
                referrerType = "user"
            } else {
                const referrerAgent = await prisma.agents.findFirst({
                    where: {
                        id: referralCode
                    }
                })
                if (referrerAgent) {
                    referrer = referrerAgent
                    referrerType = "agent"
                } else {
                    return res.status(400).json({ message: "잘못된 추천 코드입니다." });
                }
            }
        }

        if (email) {
            const existingEmail = await prisma.users.findFirst({
                where: {
                    email
                }
            })
            if (existingEmail) {
                return res.status(400).json({ message: "Email already in use" });
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
                email: email ?? "",
                // if the referrer type is user then store the referrer id to referrerId
                referrerId: referrerType === "user"
                    ? referrer
                        ? referrer.id
                        : null
                    : null,
                // if the referrer type is agent then store the referrer id to referrerAgentId
                referrerAgentId: referrerType === "agent"
                    ? referrer
                        ? referrer.id
                        : null
                    : null,
                status: false,
                bank,
                accountNumber,
                accountHolder,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: new Date(),
                lastLogout: new Date(),
                lastDevice: "",
            }
        });

        await notifyAdmin();
        return res.status(200).json({ message: "성공적으로 회원가입되었습니다!" });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
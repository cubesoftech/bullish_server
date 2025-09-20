import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser, generateRandomString } from "../../utils";

interface UpdateUserInfoPayload {
    password: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    email: string;
}

export default async function updateUserInfo(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as UpdateUserInfoPayload;

    // incase bank, accountNumber, accountHolder, or email is not provided, set them to empty string
    const processedBank = !body.bank || body.bank.trim() === "" ? "" : body.bank;
    const processedAccountNumber = !body.accountNumber || body.accountNumber.trim() === "" ? "" : body.accountNumber;
    const processedAccountHolder = !body.accountHolder || body.accountHolder.trim() === "" ? "" : body.accountHolder;
    const processedEmail = !body.email || body.email.trim() === "" ? "" : body.email;

    if (body.password.trim() === "") {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        if (processedEmail.trim() !== "") {
            const emailExists = await prisma.users.findFirst({
                where: {
                    email: processedEmail,
                    id: {
                        not: user.id
                    }
                }
            })
            if (emailExists) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }

        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.users.update({
            where: {
                id: user.id
            },
            data: {
                email: processedEmail,
                password: body.password,
                updatedAt: new Date(),
            },
        });

        if (processedBank !== userInfo.bank || processedAccountHolder !== userInfo.accountHolder || processedAccountNumber !== userInfo.accountNumber) {

            const hasPendingRequest = await prisma.user_change_info_log.findFirst({
                where: {
                    userId: userInfo.id,
                    status: "PENDING",
                }
            })
            if (hasPendingRequest) {
                return res.status(400).json({ message: "You already have a pending change request." });
            }

            await prisma.user_change_info_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: userInfo.id,
                    bank: processedBank,
                    accountNumber: processedAccountNumber,
                    accountHolder: processedAccountHolder,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })
        }

        return res.status(200).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error updating user info:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
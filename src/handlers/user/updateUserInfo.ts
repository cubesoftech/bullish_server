import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

interface UpdateUserInfoPayload {
    name: string;
    phoneNumber: string;
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

    // Validate required fields
    const validateFields = !(
        body.name.trim() === ""
        || body.phoneNumber.trim() === ""
        || body.password.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {

        const isExistingUser = await prisma.users.findFirst({
            where: {
                phoneNumber: body.phoneNumber,
                id: {
                    not: user.id // Ensure we are not updating the phone number to the same one
                }
            }
        })
        if (isExistingUser) {
            return res.status(400).json({ message: "Phone number already exists" });
        }

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
                ...body,
                bank: processedBank,
                accountNumber: processedAccountNumber,
                accountHolder: processedAccountHolder,
                email: processedEmail,
                updatedAt: new Date(),
            },
        });

        return res.status(200).json({ message: "User information updated successfully" });
    } catch (error) {
        console.error("Error updating user info:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
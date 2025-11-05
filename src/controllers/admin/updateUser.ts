import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface UpdateUserPayload {
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    balance: number;
    nickname: string;
    password: string;
    status: boolean
}

export default async function updateUserDetails(req: Request, res: Response, next: NextFunction) {
    const { userId, name, email, phoneNumber, bank, accountNumber, accountHolder, balance, nickname, password, status } = req.body as UpdateUserPayload

    if (!userId || userId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid user id"
        })
    }

    try {
        const user = await prisma.members.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return next({
                status: 400,
                message: "Member not found"
            })
        }

        const isExistingEmail = await prisma.members.findFirst({
            where: {
                id: {
                    not: user.id
                },
                email
            }
        })
        if (isExistingEmail) {
            return next({
                status: 400,
                message: "Email already exist."
            })
        }

        await prisma.members.update({
            where: {
                id: user.id
            },
            data: {
                name,
                email,
                phonenumber: phoneNumber,
                bank,
                accountnumber: accountNumber,
                accountholder: accountHolder,
                balance,
                nickname,
                password,
                confirmpassword: password,
                status,
            }
        })

        return res.status(200).json({ message: "User details updated successfully." })
    } catch (error) {
        console.log("Error admin | updateUserDetails: ", error)
        return next()
    }
}
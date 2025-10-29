import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";

interface UpdateInfoPayload {
    email: string;
    name: string;
    nickname: string;
    phonenumber: string;
    password: string;
    confirmpassword: string;
}

export default async function updateInfo(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
        })
    }

    const { email, name, nickname, phonenumber, password, confirmpassword } = req.body as UpdateInfoPayload

    if (
        !email || email.trim() === "" ||
        !name || name.trim() === "" ||
        !nickname || nickname.trim() === "" ||
        !phonenumber || phonenumber.trim() === "" ||
        !password || password.trim() === "" ||
        !confirmpassword || confirmpassword.trim() === ""
    ) {
        return next({
            status: 400,
            message: "All fields are required"
        })
    }

    if (password !== confirmpassword) {
        return next({
            status: 400,
            message: "Passwords do not match"
        })
    }

    try {
        const member = await getUserData({
            userId: user.id
        })
        if (!member) {
            return next({
                status: 404,
                message: "User not found."
            })
        }

        await prisma.members.update({
            where: {
                id: member.id
            },
            data: {
                email,
                name,
                nickname,
                phonenumber,
                password,
                confirmpassword
            }
        })

        return res.status(200).json({ message: "User info updated successfully." })
    } catch (error) {
        console.log("Error user | updateInfo:", error);
        return next()
    }
}
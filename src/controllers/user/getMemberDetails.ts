import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { getUserData } from "../../helpers";

export default async function getMemberDetails(req: Request, res: Response, next: NextFunction) {
    const { user } = req
    if (!user) {
        return next({
            status: 401,
            message: "Unauthorized"
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

        const processedMemberDetails = {
            ...member,
            password: "",
            confirmpassword: "",
        }

        return res.status(200).json({
            data: processedMemberDetails
        })
    } catch (error) {
        console.log("Error user | getMemberDetails:", error);
        return next()
    }
}
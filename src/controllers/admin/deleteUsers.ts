import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface DeleteUsersPayload {
    userIds: string[]
}

export default async function deleteUsers(req: Request, res: Response, next: NextFunction) {
    const { userIds } = req.body as DeleteUsersPayload

    if (!Array.isArray(userIds) || userIds.some(t => typeof t !== "string")) {
        return next({
            status: 400,
            message: "Invalid trade ids."
        })
    }

    try {
        await prisma.members.deleteMany({
            where: {
                id: {
                    in: userIds
                }
            }
        })

        return res.status(200).json({ message: "Users deleted successfully." })
    } catch (error) {
        console.log("Error admin | deleteUsers: ", error)
        return next();
    }
}
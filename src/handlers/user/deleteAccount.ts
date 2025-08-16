import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser } from "../../utils";

export default async function deleteAccount(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.users.delete({
            where: {
                id: userInfo.id
            }
        })

        return res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
        console.log("Error deleting user account: ", error)
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { findUser, generateRandomString } from "../../utils";

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

        const hasPendingRequest = await prisma.user_deletion_request.count({
            where: {
                userId: userInfo.id,
                status: "PENDING"
            }
        })

        if (hasPendingRequest > 0) {
            return res.status(400).json({ message: "Already has pending request." })
        }

        await prisma.user_deletion_request.create({
            data: {
                id: generateRandomString(7),
                userId: userInfo.id,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "User account deletion request successfully" });
    } catch (error) {
        console.log("Error deleting user account: ", error)
        return res.status(500).json({ message: "Internal server error." });
    }
}
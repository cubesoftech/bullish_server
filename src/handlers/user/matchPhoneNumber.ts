import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface MatchPhoneNumberPayload {
    phoneNumber: string;
}

export default async function matchPhoneNumber(req: Request, res: Response) {
    const { user } = req
    if (!user) return res.status(401).json({ message: "Unauthorized" })

    const { phoneNumber } = req.body as MatchPhoneNumberPayload;
    if (!phoneNumber || phoneNumber.trim() === "") {
        return res.status(400).json({ message: "Phone number is required" });
    }

    try {
        const userInfo = await prisma.users.findUnique({
            where: {
                id: user.id
            },
            select: {
                phoneNumber: true
            }
        })
        if (!userInfo) return res.status(404).json({ message: "User not found" })

        if (userInfo.phoneNumber !== phoneNumber) {
            return res.status(400).json({ message: "Phone number does not match" });
        }
        return res.status(200).json({ message: "Phone number matches" });
    } catch (error) {
        console.error("Error getPhoneNumber:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
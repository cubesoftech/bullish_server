import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"
import findUser from "../../utils/findUser";


export default async function getUserDetails(req: Request, res: Response) {
    const { id } = req.query;

    if (!id || typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await prisma.users.findFirst({
            where: {
                id: id
            },
            include: {
                referrer: true,
                referredUsers: true,
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ data: user });
    } catch (error) {
        console.error("Error fetching user details: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
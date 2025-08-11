import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import findUser from "../../utils/findUser";
import { generateRandomString } from "../../utils";

export default async function logout(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(400).json({ message: "User not authenticated" });
    }

    let ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress
    const device = req.headers['user-agent']?.toString() || "Unknown Device";

    if (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "::ffff:127.0.0.1") {
        ipAddress = "localhost"
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    lastLogout: new Date(),
                    lastDevice: device,
                    lastIpAddress: ipAddress ?? "Unknown IP Address",
                }
            });
            await tx.activity_log.create({
                data: {
                    id: generateRandomString(7),
                    userId: user.id,
                    ipAddress: ipAddress ?? "Unknown IP Address",
                    device,
                    activity: "LOGOUT",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        })

        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error during logout: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
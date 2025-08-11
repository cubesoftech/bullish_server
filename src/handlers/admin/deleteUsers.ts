import { Request, Response } from "express";
import { prisma } from "../../utils/prisma"

interface DeleteUserPayload {
    users: string[]
}

export default async function deleteUsers(req: Request, res: Response) {
    const { users } = req.body as DeleteUserPayload;

    if (!users || users.length === 0) {
        return res.status(400).json({ message: "No users provided" });
    }

    try {
        await prisma.users.deleteMany({
            where: {
                id: {
                    in: users
                }
            }
        });
        return res.status(200).json({ message: "Users deleted successfully" });
    } catch (error) {
        console.error("Error deleting users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
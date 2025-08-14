import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export default async function getSuggestedUsers(req: Request, res: Response) {
    const { search } = req.query;

    let where: any = {};

    if (search) {
        where = {
            OR: [
                {
                    name: {
                        contains: search as string
                    }
                },
                {
                    phoneNumber: {
                        contains: search as string
                    }
                }
            ]
        }
    };

    try {
        const users = await prisma.users.findMany({
            where,
            take: 5,
            distinct: ["name"]
        })

        return res.status(200).json({ data: users });
    } catch (error) {
        console.error("Error fetching suggested users: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
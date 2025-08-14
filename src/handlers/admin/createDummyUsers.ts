import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";

export default async function createDummyUsers(req: Request, res: Response) {

    try {
        await prisma.$transaction(
            Array.from({ length: 50 }).map(() => {
                return prisma.users.create({
                    data: {
                        id: generateRandomString(7),
                        phoneNumber: `010${Math.floor(Math.random() * 10000000)}`,
                        password: "dummyPassword",
                        name: `Dummy User ${Math.floor(Math.random() * 1000)}`,
                        birthDate: `${new Date(1990 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))}`,
                        gender: Math.random() > 0.5 ? "male" : "female",
                        status: Math.random() > 0.5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastLogin: new Date(),
                        lastLogout: new Date(),
                        lastDevice: "",
                    }
                })
            })
        )
        return res.status(200).json({ message: "Dummy users created successfully" });
    } catch (error) {
        console.error("Error creating dummy users: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { series_log, users } from "@prisma/client";

export default async function createDummyUsers(req: Request, res: Response) {
    try {
        const dummyUsers = Array.from({ length: 20 }, (_, i) => ({
            id: generateRandomString(7),
            phoneNumber: "tester" + (i + 20),
            password: "tester",
            name: "tester",
            birthDate: "20020202",
            gender: "male",
            status: true,
            email: "tester@domain.com",
            bank: "tester",
            accountNumber: "tester",
            accountHolder: "tester",
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            lastLogout: new Date(),
            lastIpAddress: "",
            lastDevice: "",
            isDeleted: false,
            referrerId: "c0616bf",
        }))

        const created = await prisma.users.createMany({
            data: dummyUsers,
            skipDuplicates: true,
        })

        return res.status(200).json({ message: `created ${created.count} users` });
    } catch (error) {
        console.error("Error creating dummy users: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
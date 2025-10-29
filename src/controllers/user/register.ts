import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomString } from "../../helpers";

interface RegisterPayload {
    email: string;
    name: string;
    password: string;
    referrer: string;
    birthdate: string;
    phonenumber: string;
    bank: string;
    accountholder: string;
    accountnumber: string;
}

export default async function register(req: Request, res: Response, next: NextFunction) {
    const { email, name, password, referrer, birthdate, phonenumber, bank, accountholder, accountnumber } = req.body as RegisterPayload;

    if (
        !email || email.trim() === "" ||
        !name || name.trim() === "" ||
        !password || password.trim() === "" ||
        !birthdate || birthdate.trim() === "" ||
        !phonenumber || phonenumber.trim() === "" ||
        !bank || bank.trim() === "" ||
        !accountholder || accountholder.trim() === "" ||
        !accountnumber || accountnumber.trim() === ""
    ) {
        return next({
            status: 400,
            message: "Missing required fields."
        });
    }

    try {
        const existingUser = await prisma.members.findFirst({
            where: {
                email
            }
        })
        if (existingUser) {
            return next({
                status: 400,
                message: "User already exist."
            });
        }

        const isTester = email.includes("test")

        const referrerData = await prisma.members.findFirst({
            where: {
                email: referrer,
                role: "AGENT"
            }
        })
        if (!referrerData) {
            return next({
                status: 404,
                message: "Referrer not found."
            })
        }

        const agent = await prisma.agents.findFirst({
            where: {
                memberId: referrerData.id
            }
        })
        if (!agent) {
            return next({
                status: 404,
                message: "Referrer not found."
            })
        }

        await prisma.$transaction(async (tx) => {
            await tx.members.create({
                data: {
                    id: generateRandomString(7),
                    email,
                    name,
                    password,
                    confirmpassword: password,
                    birthdate,
                    phonenumber,
                    bank,
                    accountholder,
                    accountnumber,
                    agentsId: agent.id,
                    status: isTester,
                    role: "USER"
                }
            })
            await tx.users.create({
                data: {
                    id: generateRandomString(7),
                    email,
                    password,
                    name,
                }
            })
        })

        return res.status(200).json({
            message: "User created successfully."
        })
    } catch (error) {
        console.log("Error user | register:", error);
        return next();
    }
}
import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomString, generateRandomStringV2, generateReferralCode } from "../../helpers";

interface CreateAgentPayload {
    name: string;
    email: string;
    password: string;
    nickname: string;
    royalty: number;
    masterAgentId: string;
}

export default async function createAgent(req: Request, res: Response, next: NextFunction) {
    const { name, email, password, nickname, royalty, masterAgentId } = req.body as CreateAgentPayload;

    if (!name || name.trim() === "" ||
        !email || email.trim() === "" ||
        !password || password.trim() === "" ||
        !nickname || nickname.trim() === "" ||
        typeof royalty !== 'number' ||
        !masterAgentId || masterAgentId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid input data."
        });
    }

    try {
        const isExistingAgent = await prisma.members.findFirst({
            where: {
                email
            }
        })
        if (isExistingAgent) {
            return next({
                status: 400,
                message: "Agent with this email already exists."
            })
        }

        await prisma.$transaction(async (tx) => {
            const user = await tx.members.create({
                data: {
                    email,
                    name,
                    nickname,
                    password,
                    role: "AGENT",
                    confirmpassword: password,
                    status: true,
                    id: generateRandomStringV2()
                }
            })
            await tx.agents.create({
                data: {
                    id: generateRandomStringV2(),
                    referralCode: generateReferralCode(),
                    masteragentsId: masterAgentId,
                    memberId: user.id,
                    royalty,
                }
            })
        })

        return res.status(200).json({
            message: "Agent created successfully."
        })
    } catch (error) {
        console.log("Error admin | createAgent:", error);
        return next();
    }
}
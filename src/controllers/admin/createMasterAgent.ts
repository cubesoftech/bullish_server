import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";
import { generateRandomStringV2, generateReferralCode } from "../../helpers";

interface CreateMasterAgentPayload {
    email: string;
    name: string;
    nickname: string;
    password: string;
    royalty: number;
}

export default async function createMasterAgent(req: Request, res: Response, next: NextFunction) {
    const { email, name, nickname, password, royalty } = req.body as CreateMasterAgentPayload;

    if (!email || email.trim() === "" ||
        !name || name.trim() === "" ||
        !nickname || nickname.trim() === "" ||
        !password || password.trim() === "" ||
        typeof royalty !== 'number') {
        return next({
            status: 400,
            message: "Invalid input data."
        });
    }

    try {
        const isExistingUser = await prisma.members.findFirst({
            where: {
                email,
                role: "AGENT"
            }
        })
        if (isExistingUser) {
            return next({
                status: 400,
                message: "Email already exists"
            })
        }

        const masterAgentId = generateRandomStringV2()
        const agentId = generateRandomStringV2()

        await prisma.$transaction(async (tx) => {
            await tx.members.createMany({
                data: [
                    {
                        id: masterAgentId,
                        email,
                        name,
                        nickname,
                        password,
                        role: "MASTER_AGENT",
                        confirmpassword: password,
                    },
                    {
                        id: agentId,
                        email,
                        name,
                        nickname,
                        password: password + 123,
                        role: "AGENT",
                        confirmpassword: password,
                    }
                ]
            });

            const masterAgent = await tx.masteragents.create({
                data: {
                    id: generateRandomStringV2(),
                    memberId: masterAgentId,
                    royalty,
                    referralCode: generateReferralCode()
                }
            })
            await tx.agents.create({
                data: {
                    id: generateRandomStringV2(),
                    referralCode: email,
                    masteragentsId: masterAgent.id,
                    memberId: agentId,
                    royalty: masterAgent.royalty,
                }
            })
        })

        return res.status(200).json({ message: "Master agent created successfully." })
    } catch (error) {
        console.log("Error admin | createMasterAgent:", error);
        return next();
    }
}
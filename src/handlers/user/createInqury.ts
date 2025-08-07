import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import findUser from "../../utils/findUser";

interface CreateInquiryPayload {
    content: string;
}

export default async function createInquiry(req: Request, res: Response) {
    const { user } = req
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const body = req.body as CreateInquiryPayload;

    const validateFields = !(
        !body.content ||
        body.content.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Invalid inquiry fields" });
    }

    try {
        const userInfo = await findUser(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.inquiry_log.create({
            data: {
                id: generateRandomString(7),
                ...body,
                reply: "",
                userId: userInfo.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        return res.status(200).json({ message: "Inquiry created successfully" });
    } catch (error) {
        console.error("Error creating inquiry: ", error);
        return res.status(500).json({ message: "Failed to create inquiry" });
    }
}
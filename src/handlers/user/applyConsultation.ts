import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface ApplyConsultationPayload {
    type: string;
    content: string;
}

export default async function applyConsultation(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as ApplyConsultationPayload;

    const processedContent = !body.content || body.content.trim() === "" ? "" : body.content;

    // Validate required fields
    const validateFields = !(
        body.type.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Please provide a type." });
    }

    try {
        // Check if the user exists
        const userInfo = await findUser(user.id)

        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.reservation_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                type: body.type,
                content: processedContent,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        await notifyAdmin();

        return res.status(201).json({ message: "Consultation applied successfully" });
    } catch (error) {
        console.error("Error applying for consultation:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
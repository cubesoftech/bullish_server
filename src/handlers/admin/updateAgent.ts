import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateAgentPayload {
    id: string;
    note: string;
}

export default async function updateAgent(req: Request, res: Response) {
    const { id, note } = req.body as UpdateAgentPayload;

    if (!id || id.trim() === "") {
        return res.status(400).json({ message: "Agent ID is required." });
    }
    if (!note || note.trim() === "") {
        return res.status(400).json({ message: "Note is required." });
    }

    try {
        const agent = await prisma.agents.findFirst({
            where: {
                id
            }
        })
        if (!agent) {
            return res.status(404).json({ message: "Agent not found." });
        }

        await prisma.agents.update({
            where: {
                id
            },
            data: {
                note,
                updatedAt: new Date()
            }
        });
        return res.status(200).json({ message: "Agent updated successfully." });
    } catch (error) {
        console.error("Error updating agent: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
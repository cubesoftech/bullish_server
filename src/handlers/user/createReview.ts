import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";

interface CreateReviewPayload {
    rating: number;
    series: number;
    review: string;
    investedAmount: number;
    profit: number;
}

export default async function createReview(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const body = req.body as CreateReviewPayload;

    // Validate required fields
    const validateFields = !(
        // check if any field is missing or invalid
        !body.rating || !body.series || !body.review || !body.investedAmount || !body.profit ||
        typeof body.rating !== "number" || typeof body.series !== "number" || typeof body.review !== "string" || typeof body.investedAmount !== "number" || typeof body.profit !== "number" ||
        isNaN(body.rating) || isNaN(body.series) || isNaN(body.investedAmount) || isNaN(body.profit) ||
        body.rating < 1 || body.rating > 5 ||
        body.series < 1 || body.series > 5 ||
        body.review.trim() === "" ||
        body.investedAmount <= 0 ||
        body.profit < 0
    )
    if (!validateFields) {
        return res.status(400).json({ message: "Invalid fields" });
    }

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.review_log.create({
            data: {
                id: generateRandomString(7),
                userId: user.id,
                ...body,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        return res.status(200).json({ message: "Review created successfully" });
    } catch (error) {
        console.error("Error during create review: ", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface CreateDummyReviewsPayload {
    name: string;
    gender: string;
    rating: number;
    series: number;
    review: string;
    investedAmount: number;
    profit: number;
}

export default async function createDummyReviews(req: Request, res: Response) {

    const body = req.body as CreateDummyReviewsPayload;

    // Validate required fields
    const validateFields = !(
        // check if any field is missing or invalid
        !body.name || body.name.trim() === "" ||
        !body.gender || body.gender.trim() === "" ||
        !body.rating || !body.series || !body.review || !body.investedAmount || !body.profit ||
        typeof body.rating !== "number" || typeof body.series !== "number" || typeof body.review !== "string" || typeof body.investedAmount !== "number" || typeof body.profit !== "number" ||
        isNaN(body.rating) || isNaN(body.series) || isNaN(body.investedAmount) || isNaN(body.profit) ||
        body.review.trim() === ""
    )
    if (!validateFields) {
        console.log("fields", body);
        return res.status(400).json({ message: "잘못된 필드입니다." });
    }

    try {

        await prisma.review_log.create({
            data: {
                id: generateRandomString(7),
                name: body.name,
                gender: body.gender,
                rating: body.rating,
                series: body.series,
                review: body.review,
                investedAmount: body.investedAmount,
                profit: body.profit,
                status: "COMPLETED",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        await notifyAdmin();

        return res.status(200).json({ message: "리뷰가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error during create review: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
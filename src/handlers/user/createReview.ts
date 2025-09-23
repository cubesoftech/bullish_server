import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { generateRandomString } from "../../utils";
import { findUser } from "../../utils";
import { notifyAdmin } from "../core/socketConnection";

interface CreateReviewPayload {
    investmentLogId: string;
    rating: number;
    series: number;
    review: string;
    investedAmount: number;
    profit: number;
}

export default async function createReview(req: Request, res: Response) {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "사용자가 인증되지 않았습니다." });
    }

    const body = req.body as CreateReviewPayload;

    // Validate required fields
    const validateFields = (
        // check if any field is missing or invalid
        !body.rating || !body.series || !body.review || !body.investedAmount || !body.profit ||
        typeof body.rating !== "number" || typeof body.series !== "number" || typeof body.review !== "string" || typeof body.investedAmount !== "number" || typeof body.profit !== "number" ||
        isNaN(body.rating) || isNaN(body.series) || isNaN(body.investedAmount) || isNaN(body.profit) ||
        body.review.trim() === "" ||
        body.investmentLogId.trim() === ""
    )
    if (!validateFields) {
        return res.status(400).json({ message: "잘못된 필드입니다." });
    }

    try {
        const userInfo = await findUser(user.id)
        if (!userInfo) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const hasPendingReview = await prisma.review_log.findFirst({
            where: {
                userId: user.id,
                investmentLogId: body.investmentLogId,
                status: "PENDING",
            }
        })
        if (hasPendingReview) {
            return res.status(400).json({ message: "이미 대기 중인 리뷰가 있습니다." });
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

        await notifyAdmin();

        return res.status(200).json({ message: "리뷰가 성공적으로 생성되었습니다." });
    } catch (error) {
        console.error("Error during create review: ", error);
        return res.status(500).json({ message: "내부 서버 오류." });
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateDummyReviewPayload {
    reviewId: string;
    name: string;
    gender: string;
    rating: number;
    series: number;
    review: string;
    investedAmount: number;
    profit: number;
}

export default async function updateDummyReview(req: Request, res: Response) {
    const { reviewId, name, gender, rating, series, review, investedAmount, profit } = req.body as UpdateDummyReviewPayload;

    if (!reviewId || reviewId.trim() === "") {
        return res.status(400).json({ message: "리뷰 ID가 필요합니다." });
    }

    if (
        !name || name.trim() === "" ||
        !gender || gender.trim() === "" ||
        !rating || series < 1 || series > 5 ||
        !review || review.trim() === "" ||
        !investedAmount || investedAmount < 0 ||
        !profit || profit < 0
    ) {
        return res.status(400).json({ message: "잘못된 필드입니다." });
    }

    try {
        const existingReview = await prisma.review_log.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!existingReview) {
            return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
        }

        await prisma.review_log.update({
            where: {
                id: existingReview.id
            },
            data: {
                name,
                gender,
                rating,
                series,
                review,
                investedAmount,
                profit,
                updatedAt: new Date(),
            }
        })

        return res.status(200).json({ message: "리뷰가 성공적으로 업데이트되었습니다." });
    } catch (error) {
        console.log("Error on admin updateDummyReview: ", error)
        return res.status(500).json({ message: "내부 서버 오류" });
    }
}
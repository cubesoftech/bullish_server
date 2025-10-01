import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface UpdateReviewCreatedAtPayload {
    reviewId: string;
    newCreatedAt: string;
}

export default async function updateReviewCreatedAt(req: Request, res: Response) {
    const { reviewId, newCreatedAt } = req.body as UpdateReviewCreatedAtPayload;

    if (!reviewId || reviewId.trim() === "") {
        return res.status(400).json({ message: "잘못된 리뷰 ID입니다." })
    }

    if (!newCreatedAt || newCreatedAt.trim() === "") {
        return res.status(400).json({ message: "잘못된 새로운 리뷰 날짜입니다." })
    }

    const processedNewCreatedAt = new Date(newCreatedAt)

    try {
        const review = await prisma.review_log.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!review) {
            return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." })
        }

        await prisma.review_log.update({
            where: {
                id: review.id
            },
            data: {
                createdAt: processedNewCreatedAt,
                updatedAt: new Date()
            }
        })

        return res.status(200).json({ message: "투자 수익이 성공적으로 업데이트되었습니다." })
    } catch (error) {
        console.log("Error on updateProfitCreatedAt: ", error)
        return res.status(500).json({ message: "내부 서버 오류." })
    }
}
import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

interface DeleteReviewPayload {
    reviewId: string;
}

export default async function deleteReview(req: Request, res: Response) {
    const { reviewId } = req.body as DeleteReviewPayload;

    if (!reviewId || reviewId.trim() === "") {
        return res.status(400).json({ error: "Missing reviewId in request body" });
    }

    try {
        const review = await prisma.review_log.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!review) {
            return res.status(404).json({ error: "리뷰를 찾을 수 없습니다." });
        }

        await prisma.review_log.delete({
            where: {
                id: review.id
            }
        })

        return res.status(200).json({ message: "리뷰가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.log("Error admin deleteReview: ", error)
        return res.status(500).json({ error: "내부 서버 오류" });
    }
}
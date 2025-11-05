import { Request, Response, NextFunction } from "express";
import prisma from "../../helpers/prisma";

interface DeleteInquryPayload {
    inquiryId: string
}

export default async function deleteInquiry(req: Request, res: Response, next: NextFunction) {
    const { inquiryId } = req.body as DeleteInquryPayload

    if (!inquiryId || inquiryId.trim() === "") {
        return next({
            status: 400,
            message: "Invalid inquiry id."
        })
    }

    try {
        const inquiry = await prisma.inquiries.findUnique({
            where: {
                id: inquiryId
            }
        })
        if (!inquiry) {
            return next({
                status: 404,
                message: "Inquiry not found."
            })
        }

        await prisma.inquiries.delete({
            where: {
                id: inquiry.id
            }
        })

        return res.status(200).json({ message: "Inquiry deleted successfully." })
    } catch (error) {
        console.log("Error admin | deleteInquiry: ", error)
        return next();
    }
}
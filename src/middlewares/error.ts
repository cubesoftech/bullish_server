import { Request, Response, NextFunction } from "express";

interface ErrorPayload {
    status: number;
    message: string;
}

export default function error(err: ErrorPayload, req: Request, res: Response, next: NextFunction) {
    const status = err.status || 500;
    const message = err.message || "Internal server error.";

    return res.status(status).json({ message });
}
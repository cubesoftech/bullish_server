import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { AuthPayload } from "../utils/interface";

export default function authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET!, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                res.status(401).json({ message: "Token Expired." })
                return;
            }
            res.status(401).json({ message: "Unauthorized" })
            return;
        }
        req.user = user as AuthPayload
        next();
    });
}
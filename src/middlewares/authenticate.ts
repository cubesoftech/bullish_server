import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { AuthPayload } from "../utils/interface";

export default function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing." });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: "Invalid authorization header format." });
    }

    const token = parts[1];

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        return res.status(500).json({ message: "Server configuration error." });
    }

    try {
        const decoded = jwt.verify(token, secret) as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}
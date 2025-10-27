import jwt from "jsonwebtoken"
import ms from "ms"
import { AuthPayload } from "./interfaces"
import { getEnvirontmentVariable } from ".";

const Access_TTL = ms("1d") / 1000; //convert to seconds;
const Refresh_TTL = ms("2d") / 1000; //convert to seconds;

export function signAccessToken(payload: { id: AuthPayload["id"] }) {
    const accessSecret = getEnvirontmentVariable("JWT_ACCESS_SECRET");
    if (!accessSecret || accessSecret.trim() === "") {
        throw new Error("JWT_ACCESS_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        payload,
        accessSecret,
        { expiresIn: Access_TTL, algorithm: "HS256" }
    )
}

export function signRefreshToken(payload: { id: AuthPayload["id"] }) {
    const refreshSecret = getEnvirontmentVariable("JWT_REFRESH_SECRET");

    if (!refreshSecret || refreshSecret.trim() === "") {
        throw new Error("JWT_REFRESH_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        payload,
        refreshSecret,
        { expiresIn: Refresh_TTL, algorithm: "HS256" }
    )
}
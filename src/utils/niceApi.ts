import axios from "axios";
import { prisma } from "./prisma";
import { generateRandomString, getEnvirontmentVariable } from ".";
import dayjs from "dayjs"
import { Request, Response } from "express";

const NICE_API_BASE_URL = getEnvirontmentVariable("NICE_API_BASE_URL");
const NICE_API_CLIENT_ID = getEnvirontmentVariable("NICE_API_CLIENT_ID");
const NICE_API_CLIENT_SECRET = getEnvirontmentVariable("NICE_API_CLIENT_SECRET");

interface AuthResponse {
    dataHeader: {
        GW_RSLT_CD: string;
        GW_RSLT_MSG: string;
    };
    dataBody: {
        access_token: string;
        token_type: string;
        expires_in: number; // in seconds or as a Unix timestamp
        scope: string;
    };
}
interface EncryptedTokenResponse {
    dataHeader: {
        GW_RSLT_CD: string;
        GW_RSLT_MSG: string;
    };
    dataBody: {
        token_val: string
    }
}

export async function getNiceApiAccessToken() {
    try {
        // const token = await prisma.nice_api_tokens.findFirst({
        //     orderBy: { createdAt: 'desc' }
        // })

        // if (token && token.expiresAt > new Date()) {
        //     return token.accessToken;
        // }

        const credentials = Buffer.from(`${NICE_API_CLIENT_ID}:${NICE_API_CLIENT_SECRET}`).toString('base64');

        const url = `${NICE_API_BASE_URL}/digital/niceid/oauth/oauth/token`;
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${credentials}`
        };

        const { data } = await axios.post(
            url,
            "grant_type=client_credentials&scope=default",
            {
                headers
            }
        )
        const { access_token, expires_in } = data.dataBody;

        const currentSeconds = Math.floor(Date.now() / 1000);
        const isUnixTimestamp = expires_in > currentSeconds;

        let expiresAt: Date = isUnixTimestamp
            ? new Date(expires_in * 1000)
            : new Date(Date.now() + (expires_in * 1000));

        await prisma.nice_api_tokens.create({
            data: {
                id: generateRandomString(7),
                accessToken: access_token,
                expiresAt,
            }
        })

        return access_token;
    } catch (error) {
        const message = axios.isAxiosError(error) && error.response
            ? JSON.stringify(error.response.data)
            : (error as Error).message;

        console.error("Error getting NICE API access token:", message);
        throw new Error(message);
    }
}

export async function getNiceEncryptedToken(req: Request, res: Response) {
    try {
        const productId = "2101979031";
        const req_dtim = dayjs().format("YYYYMMDDHHmmss");
        const req_no = generateRandomString(20); // must be unique
        const body = {
            dataHeader: {},
            dataBody: {
                req_dtim,
                req_no,
                enc_mode: "1",
            },
        };

        const data = await postToNiceApi(
            "/digital/niceid/api/v1.0/common/crypto/token",
            productId,
            body
        );

        console.log("data: ", data.dataBody)

        return res.status(200).json({ data: data.dataBody })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to get NICE encrypted token" });

    }
}

export async function postToNiceApi(endpoint: string, productId: string, body: Record<string, any>) {
    try {
        const accessToken = await getNiceApiAccessToken();

        const currentTimeStamp = Math.floor(Date.now() / 1000);

        const credentials = Buffer.from(`${accessToken}:${currentTimeStamp}:${NICE_API_CLIENT_ID}`).toString("base64");
        const authorizationValue = `bearer ${credentials}`;

        const url = `${NICE_API_BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": authorizationValue,
            "ProductID": productId
        }

        const { data } = await axios.post(url, body, { headers });

        return data;
    } catch (error) {
        const message = axios.isAxiosError(error) && error.response
            ? JSON.stringify(error.response.data)
            : (error as Error).message;

        console.error("Error posting to NICE API:", message);
        throw new Error(message);
    }
}
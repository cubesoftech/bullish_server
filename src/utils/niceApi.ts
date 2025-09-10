import axios from "axios";
import { prisma } from "./prisma";
import { generateRandomString, getEnvirontmentVariable } from ".";

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

export async function getNiceApiAccessToken() {
    try {
        const token = await prisma.nice_api_tokens.findFirst({
            orderBy: { createdAt: 'desc' }
        })

        if (token && token.expiresAt > new Date()) {
            return token.accessToken;
        }

        const credentials = Buffer.from(`${NICE_API_CLIENT_ID}:${NICE_API_CLIENT_SECRET}`).toString('base64');

        const url = `${NICE_API_BASE_URL}/digital/niceid/oauth/oauth/token`;
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${credentials}`
        };

        const { data } = await axios.post<AuthResponse>(
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

export async function postToNiceApi(endpoint: string, productId: string, body: Record<string, any>) {
    try {
        const accessToken = await getNiceApiAccessToken();
        if (!accessToken) throw new Error("No access token found");

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
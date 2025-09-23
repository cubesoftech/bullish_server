import axios from "axios";
import { prisma } from "./prisma";
import { generateRandomString, getEnvirontmentVariable } from ".";
import { Request, Response } from "express";
import crypto from "crypto";

const NICE_API_BASE_URL = getEnvirontmentVariable("NICE_API_BASE_URL");
const NICE_API_CLIENT_ID = getEnvirontmentVariable("NICE_API_CLIENT_ID");
const NICE_API_CLIENT_SECRET = getEnvirontmentVariable("NICE_API_CLIENT_SECRET");

export async function getNiceApiAccessToken() {
    try {
        // const token = await prisma.nice_api_tokens.findFirst({
        //     orderBy: { createdAt: 'desc' }
        // })

        // if (token && token.expiresAt > new Date()) {
        //     return token.accessToken;
        // }

        const accessAuth = `${NICE_API_CLIENT_ID}:${NICE_API_CLIENT_SECRET}`;
        const credentials = Buffer.from(accessAuth).toString('base64');

        const url = `${NICE_API_BASE_URL}/digital/niceid/oauth/oauth/token`;
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${credentials}`
        };
        const data = new URLSearchParams({
            grant_type: "client_credentials",
            scope: "default"
        }).toString();

        const { data: axiosData } = await axios.post(
            url,
            data,
            {
                headers
            }
        )
        const { dataHeader, dataBody } = axiosData
        const { access_token, expires_in } = dataBody;

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
    const ua = req.headers['user-agent']?.toLowerCase() || '';
    const isIOS = /iphone|ipad|ipod/.test(ua);

    try {
        const productId = "2101979031";
        const req_dtim = new Date().toISOString().replace(/[-T:]/g, "").slice(0, 14); // YYYYMMDDHHMMSS

        const randomNumber = Math.floor(Math.random() * 10_000_000_000_000).toString().padStart(13, '0');

        const req_no = 'REQ' + req_dtim + randomNumber; // must be unique
        const body = {
            dataHeader: {
                CNTY_CD: "ko",
            },
            dataBody: {
                req_dtim,
                req_no,
                enc_mode: "1",
            },
        };

        const { dataHeader, dataBody } = await postToNiceApi(
            "/digital/niceid/api/v1.0/common/crypto/token",
            productId,
            body
        );

        const { token_version_id, token_val, site_code } = dataBody

        const originalString = req_dtim + req_no + token_val
        const sha256Hash = crypto.createHash('sha256').update(originalString).digest().toString("base64");

        const key = sha256Hash.slice(0, 16); // First 16 characters for AES-128
        const iv = sha256Hash.slice(sha256Hash.length - 16); // Last 16 characters for IV
        const hmac_key = sha256Hash.slice(0, 32); // First 32 characters for HMAC key

        let returnUrl = ""
        if (isIOS) {
            returnUrl = "https://server.trusseonglobal.com/user/checkPlusCallback"
        } else {
            returnUrl = "https://www.trusseon.com/checkPlusCallback"
        }

        const plainData = {
            sitecode: site_code,
            requestno: req_no,
            returnurl: returnUrl,
        }
        const jsonData = JSON.stringify(plainData)

        const cipher = crypto.createCipheriv('aes-128-cbc', key, iv)
        let enc_data = cipher.update(jsonData, 'utf8', 'base64'); //input data is utf8, output is base64
        enc_data += cipher.final('base64')

        const hmac = crypto.createHmac('sha256', hmac_key);
        let integrity_value = hmac.update(enc_data).digest('base64');

        const returnData = {
            token_version_id,
            enc_data,
            integrity_value
        }
        const returnData2 = {
            key,
            iv,
            hmac_key
        }

        return res.status(200).json({ data: returnData, data2: returnData2 })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to get NICE encrypted token" });

    }
}

interface DecodeNiceEncryptedDataPayload {
    data1: {
        key: string;
        iv: string;
        hmac_key: string;
    };
    data2: {
        enc_data: string | null;
        integrity_value: string | null;
    };
}
export async function decodeNiceEncryptedData(req: Request, res: Response) {
    try {
        const { data1, data2 } = req.body as DecodeNiceEncryptedDataPayload;
        const { key, iv, hmac_key } = data1;
        const { enc_data, integrity_value } = data2;

        if (!enc_data || !integrity_value) {
            return res.status(400).json({ message: "Missing enc_data or integrity_value" });
        }
        if (!key || !iv || !hmac_key) {
            return res.status(400).json({ message: "Missing key, iv, or hmac_key" });
        }

        const integrityValue = crypto.createHmac("sha256", hmac_key).update(enc_data).digest("base64");
        if (integrityValue !== integrity_value) {
            return res.status(400).json({ message: "Data integrity check failed" });
        }

        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        let dec_data = decipher.update(enc_data, "base64", "utf8");
        dec_data += decipher.final("utf8");

        const parsedData: Record<string, string> = JSON.parse(dec_data);
        console.log("parsed data:", parsedData);

        const decodedData: Record<string, string> = { ...parsedData };

        if (decodedData.utf8_name) {
            decodedData.utf8_name = decodeURIComponent(decodedData.utf8_name);
        }

        return res.status(200).json({ data: decodedData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to decode NICE encrypted data: ", error });
    }
}

export async function postToNiceApi(endpoint: string, productId: string, body: Record<string, any>) {
    try {
        const accessToken = await getNiceApiAccessToken();

        const currentTimeStamp = Math.floor(new Date().getTime() / 1000);

        const cryptoAuth = `${accessToken}:${currentTimeStamp}:${NICE_API_CLIENT_ID}`;
        const credentials = Buffer.from(cryptoAuth).toString("base64");
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
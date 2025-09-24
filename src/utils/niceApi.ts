import axios from "axios";
import { prisma } from "./prisma";
import { generateRandomString, getEnvirontmentVariable } from ".";
import { Request, Response } from "express";
import crypto from "crypto";

const NICE_API_BASE_URL = getEnvirontmentVariable("NICE_API_BASE_URL");
const NICE_API_CLIENT_ID = getEnvirontmentVariable("NICE_API_CLIENT_ID");
const NICE_API_CLIENT_SECRET = getEnvirontmentVariable("NICE_API_CLIENT_SECRET");

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

export async function getNiceApiAccessToken() {
    try {

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

        const { GW_RSLT_CD } = dataHeader
        if (dataHeader.GW_RSLT_CD !== '1200') {
            generate_GW_RSLT_CD_message(GW_RSLT_CD)
        }

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
        const message = error instanceof Error
            ? error.message
            : axios.isAxiosError(error) && error.response
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

        const { GW_RSLT_CD } = dataHeader
        if (GW_RSLT_CD !== "1200") {
            generate_GW_RSLT_CD_message(GW_RSLT_CD);
        }

        const { token_version_id, token_val, site_code, rsp_cd, result_cd } = dataBody
        if (rsp_cd != 'P000') {
            generate_RSP_CD_message(rsp_cd);
        }
        if (result_cd != '0000') {
            generate_RESULT_CD_message(result_cd)
        }

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
    } catch (error: any) {
        const message = error instanceof Error ? error.message : "Failed to get NICE encrypted token";
        console.error("Error getting NICE encrypted token:", message);
        return res.status(500).json({ message });

    }
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

export function generate_GW_RSLT_CD_message(code: string) {
    let message = "";

    switch (code) {
        case '1300':
            message = "request body 가 비었습니다.";
            break;
        case '1400':
            message = "잘못된 요청";
            break;
        case '1401':
            message = "인증 필요";
            break;
        case '1402':
            message = "권한 없음";
            break;
        case '1403':
            message = "서비스 사용 중지됨";
            break;
        case '1404':
            message = "서비스를 찾을 수 없음";
            break;
        case '1500':
            message = "서버 내부 오류 : 데이터 형식 오류입니다. 요청 body 가 dataHeader/dataBody 로 나누어져있는지 확인";
            break;
        case '1501':
            message = "보호된 서비스에서 엑세스가 거부되었습니다.";
            break;
        case '1502':
            message = "보호된 서비스에서 응답이 잘못되었습니다.";
            break;
        case '1503':
            message = "일시적으로 사용할 수 없는 서비스";
            break;
        case '1700':
            message = "엑세스가 허용되지 않습니다 : CLient ID";
            break;
        case '1701':
            message = "엑세스가 허용되지 않습니다 : Service URI";
            break;
        case '1702':
            message = "엑세스가 허용되지 않습니다 : CLient ID + Client_IP";
            break;
        case '1703':
            message = "엑세스가 허용되지 않습니다 : CLient ID + Service URI";
            break;
        case '1705':
            message = "엑세스가 허용되지 않습니다 : CLient ID + Black List Client IP";
            break;
        case '1706':
            message = "엑세스가 허용되지 않습니다 : CLient ID + Product Code";
            break;
        case '1707':
            message = "엑세스가 허용되지 않습니다 : Product Code + Service URI";
            break;
        // 1711 ~ 1716 계좌 인증에서 발생
        case '1711':
            message = "거래 제한된 요일입니다.";
            break;
        case '1712':
            message = "거래 제한된 시간입니다.";
            break;
        case '1713':
            message = "거래 제한된 요일/시간입니다.";
            break;
        case '1714':
            message = "거래 제한된 일자입니다.";
            break;
        case '1715':
            message = "거래 제한된 일자/시간입니다.";
            break;
        case '1716':
            message = "공휴일 거래가 제한된 서비스입니다.";
            break;
        case '1717':
            message = "SQL 인젝션, XSS 방어";
            break;
        case '1800':
            message = "잘못된 토큰 => 기관토큰 재발급 후 확인,요청 Header 의 current_time_stamp(UTC) 가 실제 시간과 3분 이상 차이날 시 발생";
            break;
        case '1801':
            message = "잘못된 클라이언트 정보";
            break;
        case '1900':
            message = "초과된 연결횟수";
            break;
        case '1901':
            message = "초과 된 토큰 조회 실패";
            break;
        case '1902':
            message = "초과된 토근 체크 실패";
            break;
        case '1903':
            message = "초과된 접속자 수";
            break;
        case '1904':
            message = "전송 크기 초과";
            break;
        case '1905':
            message = "접속량이 너무 많음";
            break;
        case '1906':
            message = "상품이용 한도초과";
            break;
        case '1907':
            message = "API 이용 주기 초과";
            break;
        default:
            message = `알 수 없는 오류코드(GW_RSLT_CD) : ${code}, 요청 시각, client_id 를 niceid_support@nice.co.kr 로 문의`;
            break;
    }

    const error_message = `GW_RSLT_CD 오류 발생: ${code} ${message} , 개발가이드 > FAQ 를 참고해 주세요`;
    console.error(`NICE_API 에러 : ${error_message}`);
    throw new Error(error_message);
}

export function generate_RSP_CD_message(code: string) {
    let message = "";

    switch (code) {
        case 'EAPI2500':
            message = "맵핑정보 없음";
            break;
        case 'EAPI2510':
            message = "잘못된 요청";
            break;
        case 'EAPI2530':
            message = "응답전문 맵핑 오류";
            break;
        case 'EAPI2540':
            message = "대응답 정보 없음";
            break;
        case 'EAPI2550':
            message = "숫자타입 입력 오류";
            break;
        case 'EAPI2560':
            message = "실수타입 입력 오류";
            break;
        case 'EAPI2561':
            message = "실수형 타입 길이정보 문법 에러( 형식 : [전체길이,실수부길이])";
            break;
        case 'EAPI2562':
            message = "실수형 타입 논리 에러(전체 길이는 소수부 길이보다 커야합니다.";
            break;
        case 'EAPI2563':
            message = "실수형 타입 파싱 에러(입력값을 실수값으로 변환할 수 없습니다.)";
            break;
        case 'EAPI2564':
            message = "실수형 타입 정수부 길이 에러";
            break;
        case 'EAPI2565':
            message = "실수형 타입 소수부 길이 에러";
            break;
        case 'EAPI2600':
            message = "내부 시스템 오류";
            break;
        case 'EAPI2700':
            message = "외부 시스템 연동 오류";
            break;
        case 'EAPI2701':
            message = "타임아웃 발생";
            break;
        case 'EAPI2702':
            message = "DISCONNECTION_OK";
            break;
        case 'EAPI2703':
            message = "DISCONNECTION_FAIL";
            break;
        case 'EAPI2704':
            message = "RESULT_OK";
            break;
        case 'EAPI2705':
            message = "RESULT_FAIL";
            break;
        case 'EAPI2892':
            message = "반복부 카운터 에러(지정된 건수보다 크거나 작습니다.";
            break;
        case 'EAPI5001':
            message = "schema 검증정보가 없습니다.";
            break;
        case 'EAPI5002':
            message = "schema 검증 실패";
            break;
        case 'S603':
            message = "내부 DB오류.";
            break;
        case 'E998':
            message = "서비스 권한 오류 : 정지된 계약인지 확인.";
            break;
        case 'E999':
            message = "내부 시스템 오류 : 사용할 수 있는 API 목록인지 확인.";
            break;

        default:
            message = `알 수 없는 오류코드(rsp_cd) : ${code}, 요청 시각, client_id 를 niceid_support@nice.co.kr 로 문의`;
            break;
    }

    const error_message = `rsp_cd 오류 발생: ${code} ${message}`;
    console.error(`NICE_API 에러 : ${error_message}`);
    throw new Error(error_message);
}

export function generate_RESULT_CD_message(code: string) {
    let message = "";

    switch (code) {
        case '0001':
            message = "필수 입력값 오류 : 요청한 dataBody 확인, req_dtim, req_no, enc_mode 비어있는 값 없는지 확인, 규격 확인";
            break;
        case '0003':
            message = "OTP 발급 회원사 아님 [계약건 확인이 필요함] => 요청 시각, client_id 를 niceid_support@nice.co.kr 로 문의";
            break;
        case '0099':
            message = "인증 필요";
            break;

        default:
            message = `알 수 없는 오류코드(result_cd) : ${code}, 요청 시각, client_id 를 niceid_support@nice.co.kr 로 문의`;
            break;
    }

    const error_message = `result_cd 오류 발생: ${code} ${message}`;
    console.error(`NICE_API 에러 : ${error_message}`);
    throw new Error(error_message);
}
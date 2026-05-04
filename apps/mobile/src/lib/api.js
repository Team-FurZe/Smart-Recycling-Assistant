import * as FileSystem from "expo-file-system/legacy";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const AUTH_LOGIN_URL = `${BACKEND_URL}/api/v1/auth/login`;
const AUTH_SIGNUP_URL = `${BACKEND_URL}/api/v1/auth/signup`;
const HISTORY_URL = `${BACKEND_URL}/api/v1/history/me`;
const PREDICT_URL = `${BACKEND_URL}/api/v1/predict`;

async function parseJsonResponse(res) {
    const text = await res.text();

    if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Response is not valid JSON.");
    }
}

export async function loginUser(payload) {
    const res = await fetch(AUTH_LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function signupUser(payload) {
    const res = await fetch(AUTH_SIGNUP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function getMyHistory(token) {
    const res = await fetch(HISTORY_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return parseJsonResponse(res);
}

export async function predictImageFromUri(uri, token) {
    const res = await FileSystem.uploadAsync(PREDICT_URL, uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType: "image/jpeg",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status}: ${(res.body || "").slice(0, 300)}`);
    }

    try {
        return JSON.parse(res.body);
    } catch {
        throw new Error(`Response is not valid JSON: ${(res.body || "").slice(0, 300)}`);
    }
}

export { BACKEND_URL };
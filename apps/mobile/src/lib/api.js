import * as FileSystem from "expo-file-system/legacy";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.0.2.2:8080";
const PREDICT_URL = `${BACKEND_URL}/api/v1/predict`;

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
    } catch (e) {
        throw new Error(`Response is not valid JSON: ${(res.body || "").slice(0, 300)}`);
    }
}
import * as FileSystem from "expo-file-system/legacy";

const YOLO_URL = "http://192.168.1.100:8001";
const YOLO_PREDICT_URL = `${YOLO_URL}/yolo/predict`;

export async function predictYoloFromUri(uri) {
  console.log("predictYoloFromUri CALLED:", uri);

  const MULTIPART = 1;

  const res = await FileSystem.uploadAsync(YOLO_PREDICT_URL, uri, {
    httpMethod: "POST",
    uploadType: MULTIPART,
    fieldName: "file",
    mimeType: "image/jpeg",
  });

  console.log("YOLO upload status:", res.status);
  console.log("YOLO upload body (first 300):", (res.body || "").slice(0, 300));

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`YOLO HTTP ${res.status}: ${(res.body || "").slice(0, 300)}`);
  }

  try {
    return JSON.parse(res.body);
  } catch (e) {
    throw new Error(`YOLO response is not JSON: ${(res.body || "").slice(0, 300)}`);
  }
}

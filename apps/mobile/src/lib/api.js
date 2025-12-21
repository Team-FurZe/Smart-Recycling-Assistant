// ✅ Backend (Spring) - eski model endpoint
const BACKEND_URL = "http://172.16.1.172:8080";
const PREDICT_URL = `${BACKEND_URL}/api/v1/predict`;

// ✅ YOLO service (FastAPI) - yeni endpoint
// Telefonda localhost çalışmaz. Buraya PC'nin LAN IP'si gelmeli.
const YOLO_URL = "http://192.168.1.199:8001";
const YOLO_PREDICT_URL = `${YOLO_URL}/yolo/predict`;

// 10 sn timeout'lu fetch helper
async function fetchWithTimeout(resource, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ✅ Eski model (tek label)
export async function predictImageFromUri(uri) {
  const form = new FormData();
  form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" });

  let res;
  try {
    res = await fetchWithTimeout(PREDICT_URL, { method: "POST", body: form }, 10000);
  } catch (e) {
    throw new Error(`Network/timeout: ${e.message || e}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// ✅ YOLO (multi-detection)
export async function predictYoloFromUri(uri) {
  const form = new FormData();
  form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" });

  let res;
  try {
    res = await fetchWithTimeout(YOLO_PREDICT_URL, { method: "POST", body: form }, 20000);
  } catch (e) {
    throw new Error(`YOLO Network/timeout: ${e.message || e}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`YOLO HTTP ${res.status}: ${text}`);
  }

  // expected:
  // { imageWidth, imageHeight, noWaste, detections:[{id,label,binColor,confidence,bbox:{x,y,width,height}}] }
  return res.json();
}

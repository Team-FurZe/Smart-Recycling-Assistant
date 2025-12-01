const BACKEND_URL = "http://192.168.1.199:8080"; // <-- kendi LAN IP’ni yaz
const PREDICT_URL = `${BACKEND_URL}/api/v1/predict`;

// 10 sn timeout'lu fetch helper
async function fetchWithTimeout(resource, options = {}, timeoutMs = 10000) {
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

export async function predictImageFromUri(uri) {
  const form = new FormData();
  form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" });

  // Content-Type ELLE AYARLAMA! RN boundary'yi kendi ekler.
  let res;
  try {
    res = await fetchWithTimeout(PREDICT_URL, { method: "POST", body: form }, 10000);
  } catch (e) {
    // Ağ hatası veya timeout
    throw new Error(`Network/timeout: ${e.message || e}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

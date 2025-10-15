// Android emulator: http://10.0.2.2:8080
// iOS simulator:    http://localhost:8080
// Physical device:  http://<YOUR_LAN_IP>:8080
const BACKEND_URL = "http://10.0.2.2:8080";

export async function predictImageFromUri(uri) {
  const form = new FormData();
  form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" });
  const res = await fetch(`${BACKEND_URL}/api/v1/predict`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
  return res.json();
}

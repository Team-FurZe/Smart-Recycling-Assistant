export async function predictImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("http://localhost:8080/api/v1/predict", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Predict failed");
  return res.json(); // { label, confidence, binColor, tips[] }
}

// ✅ NEW: YOLO multi-detection endpoint (ai-service)
export async function predictYolo(file) {
  const form = new FormData();
  form.append("file", file);

  // default: local YOLO service (uvicorn ... --port 8001)
  const baseUrl = import.meta.env.VITE_YOLO_URL || "http://localhost:8001";

  const res = await fetch(`${baseUrl}/yolo/predict`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "YOLO predict failed");
  }

  return res.json();
  // expected:
  // { imageWidth, imageHeight, detections: [{id,label,binColor,confidence,bbox:{x,y,width,height}}] }
}

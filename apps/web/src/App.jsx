import React, { useMemo, useState } from "react";
import { predictYolo } from "./lib/api";
import ImageWithDetections from "./components/ImageWithDetections";
import DetectionsList from "./components/DetectionsList";

const BIN_COLORS = {
  BIODEGRADABLE: "#8BC34A",
  CARDBOARD: "#A1887F",
  GLASS: "#4CAF50",
  METAL: "#9E9E9E",
  PAPER: "#2196F3",
  PLASTIC: "#FFC107",
};

function binColorOf(label) {
  return BIN_COLORS[label] || "#FFFFFF";
}

// bbox crop -> File
async function cropFileFromBBox(originalFile, bbox) {
  const bitmap = await createImageBitmap(originalFile);

  const sx = Math.max(0, Math.floor(bbox.x));
  const sy = Math.max(0, Math.floor(bbox.y));
  const sw = Math.max(1, Math.floor(bbox.width));
  const sh = Math.max(1, Math.floor(bbox.height));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
  if (!blob) throw new Error("Crop failed");

  return new File([blob], "crop.jpg", { type: "image/jpeg" });
}

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // YOLO result: { imageWidth, imageHeight, noWaste, detections: [...] }
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // Try-again sonucu farklı çıkarsa override ediyoruz
  const [overrides, setOverrides] = useState({});
  // Aynı objede tekrar tekrar aynı label'e düşmesin diye
  const [triedById, setTriedById] = useState({});
  const [retryStateById, setRetryStateById] = useState({});

  const viewDetections = useMemo(() => {
    if (!result?.detections) return [];
    return result.detections.map((d) => {
      const label = overrides[d.id] || d.label;
      return { ...d, label, binColor: binColorOf(label) };
    });
  }, [result, overrides]);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setOverrides({});
    setTriedById({});
    setRetryStateById({});

    if (selected) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selected);
      });
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const yoloRes = await predictYolo(file);
      setResult(yoloRes);

      // yeni predict'te sıfırla
      setOverrides({});
      setTriedById({});
      setRetryStateById({});
    } catch (e) {
      alert(e.message || "YOLO Predict error");
    } finally {
      setLoading(false);
    }
  }

  function addTried(id, label) {
    setTriedById((prev) => {
      const arr = prev[id] ? [...prev[id]] : [];
      if (!arr.includes(label)) arr.push(label);
      return { ...prev, [id]: arr };
    });
  }

  async function onTryAgain(det) {
    if (!file) return;

    setRetryStateById((prev) => ({ ...prev, [det.id]: { loading: true, message: "" } }));

    try {
      const cropFile = await cropFileFromBBox(file, det.bbox);
      const cropRes = await predictYolo(cropFile);

      const currentLabel = overrides[det.id] || det.label;
      const tried = triedById[det.id] || [];

      // crop sonucunda detection yoksa:
      if (cropRes?.noWaste || !cropRes?.detections?.length) {
        setRetryStateById((prev) => ({
          ...prev,
          [det.id]: { loading: false, message: "Try again: no detection found on crop." },
        }));
        return;
      }

      // crop sonuçlarından "farklı" bir label bulmaya çalış
      const candidates = cropRes.detections;
      const firstDifferent = candidates.find((c) => c.label !== currentLabel && !tried.includes(c.label));

      if (!firstDifferent) {
        const fallback = candidates[0]?.label;
        if (fallback) addTried(det.id, fallback);

        setRetryStateById((prev) => ({
          ...prev,
          [det.id]: { loading: false, message: "Try again: different result not found (same as before)." },
        }));
        return;
      }

      const newLabel = firstDifferent.label;
      addTried(det.id, newLabel);
      setOverrides((prev) => ({ ...prev, [det.id]: newLabel }));

      setRetryStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Updated to: ${newLabel}` },
      }));
    } catch (e) {
      setRetryStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Error: ${e.message || e}` },
      }));
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>Smart Recycle Assistant (Web) — YOLO</h2>

      {previewUrl && (
        <div style={{ margin: "16px 0 16px", display: "flex", justifyContent: "center" }}>
          {!result ? (
            <img
              src={previewUrl}
              alt="Selected preview"
              style={{
                maxWidth: "100%",
                maxHeight: 420,
                borderRadius: 8,
                border: "1px solid #ddd",
                objectFit: "contain",
              }}
            />
          ) : (
            <ImageWithDetections
              imageUrl={previewUrl}
              detections={viewDetections}
              imageWidth={result.imageWidth}
              imageHeight={result.imageHeight}
            />
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading} style={{ marginLeft: 12 }}>
          {loading ? "Predicting..." : "Predict (YOLO)"}
        </button>
      </form>

      {/* ✅ NO_WASTE banner */}
      {result?.noWaste && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fafafa",
            fontWeight: 800,
          }}
        >
          NO_WASTE — No detectable waste found in this image.
        </div>
      )}

      {/* detections varsa listeyi göster */}
      {result && !result.noWaste && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: 0, marginBottom: 8 }}>
            Detections ({Array.isArray(viewDetections) ? viewDetections.length : 0})
          </h4>

          <DetectionsList detections={viewDetections} retryStateById={retryStateById} onTryAgain={onTryAgain} />
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { predictImage } from "../lib/api";
import { disconnectArduino, getArduinoCommandForLabel, sendArduinoSortCommand } from "../lib/arduinoSerial";
import ImageWithDetections from "./ImageWithDetections";
import DetectionsList from "./DetectionsList";
import "../styles/panel.css";

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

export default function DetectionPanel() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // YOLO result: { imageWidth, imageHeight, noWaste, detections: [...] }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // If try-again returns different label, override it for that detection id
  const [overrides, setOverrides] = useState({});
  const [triedById, setTriedById] = useState({});
  const [retryStateById, setRetryStateById] = useState({});
  const [sortStateById, setSortStateById] = useState({});

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      disconnectArduino().catch(() => {});
    };
  }, []);

  const viewDetections = useMemo(() => {
    if (!result?.detections) return [];
    return result.detections.map((d) => {
      const label = overrides[d.id] || d.label;
      return { ...d, label, binColor: binColorOf(label) };
    });
  }, [result, overrides]);

  function resetAll() {
    setFile(null);
    setResult(null);
    setOverrides({});
    setTriedById({});
    setRetryStateById({});
    setSortStateById({});
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;

    setFile(selected);
    setResult(null);
    setOverrides({});
    setTriedById({});
    setRetryStateById({});
    setSortStateById({});

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
        const token = localStorage.getItem("token");
        const yoloRes = await predictImage(file, token);
        setResult(yoloRes);

        // reset per new predict
        setOverrides({});
        setTriedById({});
        setRetryStateById({});
        setSortStateById({});
    } catch (err) {
      alert(err?.message || "YOLO Predict error");
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
      const token = localStorage.getItem("token");
      const cropRes = await predictImage(cropFile, token);

      const currentLabel = overrides[det.id] || det.label;
      const tried = triedById[det.id] || [];

      if (cropRes?.noWaste || !cropRes?.detections?.length) {
        setRetryStateById((prev) => ({
          ...prev,
          [det.id]: { loading: false, message: "Try again: no detection found on crop." },
        }));
        return;
      }

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
    } catch (err) {
      setRetryStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Error: ${err?.message || err}` },
      }));
    }
  }

  async function onSortWaste(det) {
    if (!getArduinoCommandForLabel(det.label)) {
      setSortStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: "Arduino: this class is not mapped to a bin." },
      }));
      return;
    }

    setSortStateById((prev) => ({ ...prev, [det.id]: { loading: true, message: "" } }));

    try {
      await sendArduinoSortCommand(det.label);
      setSortStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: "Detection is sent to Smart Recycling Bin." },
      }));
    } catch (err) {
      setSortStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Arduino: ${err?.message || err}` },
      }));
    }
  }

  return (
    <div className="sra-panel">
      <div className="sra-panel__top">
        <div>
          <h2 className="sra-panel__title">AI Detection Demo</h2>
          <p className="sra-panel__subtitle">Upload an image and run YOLO detection.</p>
        </div>

        <div className="sra-panel__actions">
          {/* FIX: handleReset doesn't exist -> use resetAll */}
          <button className="btn-reset" type="button" onClick={resetAll}>
            Reset
          </button>
        </div>
      </div>

      <div className="sra-panel__grid">
        <div className="sra-card">
          <h3 className="sra-card__title">Upload</h3>

          <form onSubmit={handleSubmit} className="sra-form">
            <input className="sra-input" type="file" accept="image/*" onChange={handleFileChange} />
            <button className="sra-btn" type="submit" disabled={!file || loading}>
              {loading ? "Predicting..." : "Run Detection"}
            </button>
          </form>

          {result?.noWaste && (
            <div className="sra-alert sra-alert--info">
              <strong>NO_WASTE</strong> - No detectable waste found in this image.
            </div>
          )}
        </div>

        <div className="sra-card">
          <h3 className="sra-card__title">Preview</h3>

          {!previewUrl ? (
            <div className="sra-empty">Choose an image to see preview.</div>
          ) : !result ? (
            <img className="sra-preview" src={previewUrl} alt="Selected preview" />
          ) : (
            <ImageWithDetections
              imageUrl={previewUrl}
              detections={viewDetections}
              imageWidth={result.imageWidth}
              imageHeight={result.imageHeight}
            />
          )}
        </div>
      </div>

      {result && !result.noWaste && (
        <div className="sra-card sra-card--full">
          <div className="sra-card__header">
            <h3 className="sra-card__title">Detections</h3>
            <span className="sra-badge">{viewDetections.length}</span>
          </div>

          <DetectionsList
            detections={viewDetections}
            retryStateById={retryStateById}
            sortStateById={sortStateById}
            onSortWaste={onSortWaste}
            onTryAgain={onTryAgain}
          />
        </div>
      )}
    </div>
  );
}

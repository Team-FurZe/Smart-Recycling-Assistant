import React, { useState } from "react";
import { predictImage } from "../lib/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selected);
      });
    } else {
      setPreviewUrl(prev => {
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
      const prediction = await predictImage(file);
      setResult(prediction);
    } catch (e) {
      alert(e.message || "Predict error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h2>Smart Recycle Assistant (Web)</h2>

      {previewUrl && (
        <div
          style={{
            margin: "16px 0 24px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src={previewUrl}
            alt="Selected preview"
            style={{
              maxWidth: "100%",
              maxHeight: 320,
              borderRadius: 8,
              border: "1px solid #ddd",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <button
          type="submit"
          disabled={!file || loading}
          style={{ marginLeft: 12 }}
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h4 style={{ margin: 0, marginBottom: 8 }}>Result</h4>
          <div>Label: {result.label}</div>
          <div>Confidence: {(result.confidence * 100).toFixed(2)}%</div>
          <div>Bin Color: {result.binColor}</div>
          {Array.isArray(result.tips) && result.tips.length > 0 && (
            <>
              <div style={{ marginTop: 8, fontWeight: 600 }}>Tips</div>
              <ul style={{ marginTop: 6 }}>
                {result.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

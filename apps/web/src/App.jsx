import React, { useState } from "react";
import { predictImage } from "./lib/api";

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Keeps track of labels the user said are wrong
  const [excludedLabels, setExcludedLabels] = useState([]);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    // reset previous result & excluded labels when a new file is selected
    setResult(null);
    setExcludedLabels([]);

    if (selected) {
      // Revoke old URL if exists
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
      const prediction = await predictImage(file);

      // Reset excluded labels for a fresh prediction
      setExcludedLabels([]);

      // Store full prediction including probabilities
      setResult(prediction);
    } catch (e) {
      alert(e.message || "Predict error");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Feedback handler: try another category without excluded ones
  function handleFeedback() {
    if (!result || !result.probabilities) return;

    const currentLabel = result.label;

    // 1) Update excluded labels (include current label)
    const updatedExcluded = [...excludedLabels];
    if (!updatedExcluded.includes(currentLabel)) {
      updatedExcluded.push(currentLabel);
    }

    // 2) Build candidate list from probabilities excluding these labels
    const entries = Object.entries(result.probabilities);

    const candidates = entries
      .filter(([label]) => !updatedExcluded.includes(label))
      .sort((a, b) => b[1] - a[1]); // sort desc by probability

    if (candidates.length === 0) {
      // No more categories left to suggest
      setExcludedLabels(updatedExcluded);
      alert(
        "No other categories left to suggest. Please select the correct category manually."
      );
      return;
    }

    // 3) Pick next best candidate
    const [nextLabel, nextProb] = candidates[0];

    // 4) Update state
    setExcludedLabels(updatedExcluded);

    setResult((prev) => ({
      ...prev,
      label: nextLabel,
      confidence: nextProb,
    }));
  }

  const hasProbabilities =
    result && result.probabilities && Object.keys(result.probabilities).length > 0;

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h2>Smart Recycle Assistant (Web)</h2>

      {/* 🔹 Preview area – under title, above file input */}
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
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading} style={{ marginLeft: 12 }}>
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
          <div>
            Confidence: {(result.confidence * 100).toFixed(2)}
            %
          </div>
          <div>Bin Color: {result.binColor}</div>

          {/* 🔹 Optional: show excluded labels info */}
          {excludedLabels.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Ignored categories: {excludedLabels.join(", ")}
            </div>
          )}

          {/* 🔹 Feedback button */}
          {hasProbabilities && (
            <button
              type="button"
              onClick={handleFeedback}
              style={{
                marginTop: 12,
                padding: "6px 10px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              This prediction looks wrong, try another
            </button>
          )}

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

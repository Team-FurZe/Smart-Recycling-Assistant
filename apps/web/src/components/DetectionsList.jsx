import React, { useMemo } from "react";
import { getClassTip } from "../lib/recyclingTips";

export default function DetectionsList({ detections, retryStateById, onTryAgain }) {
  const sorted = useMemo(() => {
    if (!Array.isArray(detections)) return [];
    return [...detections].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [detections]);

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      {sorted.map((det) => {
        const retryState = retryStateById?.[det.id] || { loading: false, message: "" };
        const classTip = getClassTip(det.label);

        return (
          <div
            className="sra-detection-item"
            key={det.id}
            style={{
              border: `2px solid ${det.binColor}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>
                  #{det.id}{" "}
                  <span aria-hidden="true">-</span>{" "}
                  <span className="sra-detection-tip-trigger" tabIndex={0} style={{ "--tip-color": det.binColor }}>
                    {det.label}
                    <span className="sra-detection-tip-card" role="tooltip">
                      <span className="sra-detection-tip-card__title">{classTip.title}</span>
                      <span className="sra-detection-tip-card__status">
                        {classTip.recyclable ? "Recyclable" : "Special collection required"}
                      </span>
                      <span className="sra-detection-tip-card__label">Tips</span>
                      <ul className="sra-detection-tip-card__list">
                        {classTip.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </span>
                  </span>
                </div>
                <div className="sra-detection-meta">
                  Confidence: {(det.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTryAgain(det)}
                disabled={retryState.loading}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1px solid ${det.binColor}`,
                  background: "transparent",
                  cursor: retryState.loading ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
              >
                {retryState.loading ? "Trying..." : "Try again"}
              </button>
            </div>

            {retryState.message ? (
              <div className="sra-detection-message">{retryState.message}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

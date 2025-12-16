import React, { useMemo } from "react";

export default function DetectionsList({ detections, retryStateById, onTryAgain }) {
  const sorted = useMemo(() => {
    if (!Array.isArray(detections)) return [];
    return [...detections].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [detections]);

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      {sorted.map((det) => {
        const retryState = retryStateById?.[det.id] || { loading: false, message: "" };

        return (
          <div
            key={det.id}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              border: `2px solid ${det.binColor}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>
                  #{det.id} — {det.label}
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>
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
              <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>{retryState.message}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

import React, { useMemo } from "react";
import { getClassTip } from "../lib/recyclingTips";

export default function DetectionsList({ detections, retryStateById, onTryAgain }) {
  const sorted = useMemo(() => {
    if (!Array.isArray(detections)) return [];
    return [...detections].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [detections]);

  return (
    <div className="sra-detection-list">
      {sorted.map((det) => {
        const retryState = retryStateById?.[det.id] || { loading: false, message: "" };
        const classTip = getClassTip(det.label);

        return (
          <div
            className="sra-detection-item"
            key={det.id}
            style={{ "--detection-color": det.binColor }}
          >
            <div className="sra-detection-item__top">
              <div>
                <div className="sra-detection-title">
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
                className="sra-detection-retry"
                type="button"
                onClick={() => onTryAgain(det)}
                disabled={retryState.loading}
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

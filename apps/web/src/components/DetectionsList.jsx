import React, { useMemo } from "react";
import { getArduinoDirectionForLabel } from "../lib/arduinoSerial";
import { getClassTip } from "../lib/recyclingTips";

function TrashCanIcon() {
  return (
    <svg className="sra-detection-sort__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function DetectionsList({ detections, retryStateById, sortStateById, onSortWaste, onTryAgain }) {
  const sorted = useMemo(() => {
    if (!Array.isArray(detections)) return [];
    return [...detections].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [detections]);

  return (
    <div className="sra-detection-list">
      {sorted.map((det) => {
        const retryState = retryStateById?.[det.id] || { loading: false, message: "" };
        const sortState = sortStateById?.[det.id] || { loading: false, message: "" };
        const classTip = getClassTip(det.label);
        const sortDirection = getArduinoDirectionForLabel(det.label);

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

              <div className="sra-detection-actions">
                <button
                  className="sra-detection-sort"
                  type="button"
                  onClick={() => onSortWaste(det)}
                  disabled={!sortDirection || sortState.loading}
                  title={
                    sortDirection
                      ? `Send ${sortDirection} sorting command to Arduino`
                      : "Arduino sorting is available for plastic, paper, glass, and metal"
                  }
                  aria-label={
                    sortDirection
                      ? `Send ${det.label} to ${sortDirection} bin`
                      : `No Arduino sorting command for ${det.label}`
                  }
                >
                  <TrashCanIcon />
                </button>

                <button
                  className="sra-detection-retry"
                  type="button"
                  onClick={() => onTryAgain(det)}
                  disabled={retryState.loading}
                >
                  {retryState.loading ? "Trying..." : "Try again"}
                </button>
              </div>
            </div>

            {sortState.message ? (
              <div className="sra-detection-message">{sortState.message}</div>
            ) : null}

            {retryState.message ? (
              <div className="sra-detection-message">{retryState.message}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

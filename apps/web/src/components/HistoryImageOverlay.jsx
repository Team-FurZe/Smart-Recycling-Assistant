import { useMemo } from "react";
import "./HistoryImageOverlay.css";

export default function HistoryImageOverlay({ imageUrl, predictionJson, alt }) {
    const parsed = useMemo(() => {
        if (!predictionJson) return null;

        try {
            return JSON.parse(predictionJson);
        } catch {
            return null;
        }
    }, [predictionJson]);

    const detections = parsed?.detections || [];
    const imageWidth = parsed?.imageWidth || 1;
    const imageHeight = parsed?.imageHeight || 1;

    return (
        <div className="history-overlay">
            <img
                src={imageUrl}
                alt={alt || "History item"}
                className="history-overlay__image"
            />

            <div className="history-overlay__canvas">
                {Array.isArray(detections) &&
                    detections.map((item, index) => {
                        const bbox = item?.bbox;
                        if (!bbox) return null;

                        const left = (bbox.x / imageWidth) * 100;
                        const top = (bbox.y / imageHeight) * 100;
                        const width = (bbox.width / imageWidth) * 100;
                        const height = (bbox.height / imageHeight) * 100;

                        return (
                            <div
                                key={item.id || `${item.label}-${index}`}
                                className="history-overlay__box"
                                style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                    borderColor: item.binColor || "#4CAF50",
                                }}
                            >
                                <div
                                    className="history-overlay__label"
                                    style={{
                                        backgroundColor: item.binColor || "#4CAF50",
                                    }}
                                >
                                    {item.label}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {!parsed?.noWaste && Array.isArray(detections) && detections.length > 0 && (
                <div className="history-overlay__legend">
                    {detections.map((item, index) => (
                        <span
                            className="history-overlay__legend-badge"
                            key={item.id || `${item.label}-${index}-legend`}
                            style={{
                                borderColor: item.binColor || "#4CAF50",
                            }}
                        >
              <span
                  className="history-overlay__legend-dot"
                  style={{
                      backgroundColor: item.binColor || "#4CAF50",
                  }}
              />
                            {item.label}
            </span>
                    ))}
                </div>
            )}
        </div>
    );
}
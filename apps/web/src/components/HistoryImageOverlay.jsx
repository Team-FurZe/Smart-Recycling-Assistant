import { useMemo } from "react";

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
        <div className="history-image-wrap">
            <img
                src={imageUrl}
                alt={alt || "History item"}
                className="history-preview"
            />

            {Array.isArray(detections) &&
                detections.map((item) => {
                    const bbox = item?.bbox;
                    if (!bbox) return null;

                    const left = (bbox.x / imageWidth) * 100;
                    const top = (bbox.y / imageHeight) * 100;
                    const width = (bbox.width / imageWidth) * 100;
                    const height = (bbox.height / imageHeight) * 100;

                    return (
                        <div
                            key={item.id}
                            className="history-overlay-box"
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                                borderColor: item.binColor || "#22c55e",
                            }}
                        >
              <span
                  className="history-overlay-label"
                  style={{
                      background: item.binColor || "#22c55e",
                  }}
              >
                {item.id} · {item.label}
              </span>
                        </div>
                    );
                })}
        </div>
    );
}
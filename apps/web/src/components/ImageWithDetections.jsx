import React, { useMemo, useRef, useState } from "react";

export default function ImageWithDetections({ imageUrl, detections, imageWidth, imageHeight }) {
  const imgRef = useRef(null);
  const [renderSize, setRenderSize] = useState({ w: 1, h: 1 });

  const scale = useMemo(() => {
    const sx = renderSize.w / (imageWidth || 1);
    const sy = renderSize.h / (imageHeight || 1);
    return { sx, sy };
  }, [renderSize, imageWidth, imageHeight]);

  function handleImageLoad() {
    if (!imgRef.current) return;
    setRenderSize({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
  }

  return (
    <div className="sra-image-detection">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Selected preview"
        onLoad={handleImageLoad}
        className="sra-image-detection__image"
      />

      {Array.isArray(detections) &&
        detections.map((det) => {
          const { x, y, width, height } = det.bbox;

          const left = x * scale.sx;
          const top = y * scale.sy;
          const w = width * scale.sx;
          const h = height * scale.sy;

          return (
            <div
              key={det.id}
              style={{
                position: "absolute",
                left,
                top,
                width: w,
                height: h,
                border: `3px solid ${det.binColor}`,
                borderRadius: 8,
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 6,
                  top: 6,
                  padding: "2px 6px",
                  borderRadius: 7,
                  background: det.binColor,
                  color: "#111",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {det.id}
              </div>
            </div>
          );
        })}
    </div>
  );
}

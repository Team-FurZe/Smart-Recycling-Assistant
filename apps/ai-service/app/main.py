from pathlib import Path
import io

import numpy as np
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO


# ---------------------------------------------------
# Device selection (cuda / mps / cpu)
# ---------------------------------------------------
def select_device() -> str:
    """
    Select the best available device:
    - cuda (NVIDIA GPU)
    - mps  (Apple Silicon)
    - cpu  (fallback)
    """
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


# ---------------------------------------------------
# Class names + bin colors
# Must match your data.yaml order
# ---------------------------------------------------
CLASS_NAMES = [
    "BIODEGRADABLE",
    "CARDBOARD",
    "GLASS",
    "METAL",
    "PAPER",
    "PLASTIC",
]

BIN_COLORS = {
    "BIODEGRADABLE": "#8BC34A",  # green-ish
    "CARDBOARD":     "#A1887F",  # brown
    "GLASS":         "#4CAF50",  # green
    "METAL":         "#9E9E9E",  # gray
    "PAPER":         "#2196F3",  # blue
    "PLASTIC":       "#FFC107",  # yellow
}


# ---------------------------------------------------
# Load YOLO model
# ---------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent  # .../apps/ai-service/app
MODEL_PATH = BASE_DIR / "models" / "yolo_waste_v2.pt"

device = select_device()
print(f"[YOLO] Device: {device}")
print(f"[YOLO] Loading model from: {MODEL_PATH}")

if not MODEL_PATH.exists():
    raise RuntimeError(f"Model file not found at: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

# ---------------------------------------------------
# Detection thresholds
# ---------------------------------------------------
# Increase CONF_THRESH to reduce false positives (and show NO_WASTE more often)
# Decrease CONF_THRESH to detect more objects (but may include more false positives)
CONF_THRESH = 0.35
IOU_THRESH = 0.60


# ---------------------------------------------------
# FastAPI app (separate YOLO app)
# ---------------------------------------------------
app = FastAPI(title="Smart Recycling Assistant - YOLO Service")

# CORS config (şimdilik herkese açık, istersen kısıtlarsın)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # burada backend URL'ini belirtmek daha güvenli
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------
# Health endpoint for YOLO service
# ---------------------------------------------------
@app.get("/yolo/health")
async def health_yolo():
    return {"status": "ok", "device": device}


# ---------------------------------------------------
# YOLO prediction endpoint
# (farklı olsun diye /yolo/predict yaptım)
# ---------------------------------------------------
@app.post("/yolo/predict")
async def predict_yolo(file: UploadFile = File(...)):
    # 1) Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # 2) Read and decode image
    image_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {e}")

    image_np = np.array(image)

    # 3) Run YOLO prediction
    # conf + iou thresholds help reduce false positives
    results = model.predict(
        source=image_np,
        device=device,
        verbose=False,
        conf=CONF_THRESH,
        iou=IOU_THRESH,
    )[0]  # single image

    detections = []

    # 4) Parse YOLO boxes
    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESH:
            continue

        # xyxy -> [x1, y1, x2, y2]
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls_id = int(box.cls[0])

        if 0 <= cls_id < len(CLASS_NAMES):
            label = CLASS_NAMES[cls_id]
        else:
            label = f"CLASS_{cls_id}"

        bin_color = BIN_COLORS.get(label, "#FFFFFF")

        detections.append({
            "id": None,  # will be filled later
            "label": label,
            "binColor": bin_color,
            "confidence": conf,
            "bbox": {
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
            }
        })

    # 5) Sort by (y, x) so numbering is consistent (top-left to bottom-right)
    detections.sort(key=lambda d: (d["bbox"]["y"], d["bbox"]["x"]))

    # 6) Assign IDs: 01, 02, 03, ...
    for idx, det in enumerate(detections, start=1):
        det["id"] = f"{idx:02d}"

    # 7) NO_WASTE behavior
    response = {
        "imageWidth": image.width,
        "imageHeight": image.height,
        "noWaste": len(detections) == 0,
        "detections": detections,
    }

    return response

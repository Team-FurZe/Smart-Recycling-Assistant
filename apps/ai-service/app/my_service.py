from fastapi import FastAPI, UploadFile, File, HTTPException
from contextlib import asynccontextmanager
from typing import Optional
from PIL import Image
import numpy as np
import io, os

MODEL_PATH = os.environ.get("MODEL_PATH", "model_finetuned.h5")
CLASS_NAMES = ['battery','biological','cardboard','clothes','glass','metal','paper','plastic','shoes','trash']
BIN_COLORS = {
    "plastic":"blue","paper":"blue","metal":"yellow","glass":"green","cardboard":"blue",
    "biological":"brown","battery":"red","trash":"gray","clothes":"pink","shoes":"pink"
}

tf_loaded = False
model = None

def try_load_model() -> Optional[object]:
    global tf_loaded, model
    if not os.path.exists(MODEL_PATH):
        return None
    try:
        from tensorflow.keras.models import load_model
        model = load_model(MODEL_PATH)
        tf_loaded = True
        print(f"✅ Model loaded: {MODEL_PATH}")
        return model
    except Exception as e:
        print(f"⚠️  Model load failed ({MODEL_PATH}): {e}")
        return None

def preprocess(pil: Image.Image) -> np.ndarray:
    pil = pil.convert("RGB").resize((224, 224))
    arr = np.asarray(pil, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

def predict_with_model(pil: Image.Image):
    x = preprocess(pil)
    preds = model.predict(x)
    idx = int(np.argmax(preds[0]))
    label = CLASS_NAMES[idx]
    conf = float(np.max(preds[0]))
    return {"label": label, "confidence": conf, "binColor": BIN_COLORS.get(label, "unknown")}

def predict_stub(pil: Image.Image):
    label = "plastic" if pil.size[0] >= pil.size[1] else "paper"
    conf = 0.66
    return {"label": label, "confidence": conf, "binColor": BIN_COLORS.get(label, "unknown")}

@asynccontextmanager
async def lifespan(app: FastAPI):
    try_load_model()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok", "model": ("loaded" if tf_loaded else "stub")}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image/* allowed")
    data = await file.read()
    try:
        pil = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")
    out = predict_with_model(pil) if tf_loaded and model is not None else predict_stub(pil)
    out["confidence"] = round(float(out["confidence"]), 3)
    return out

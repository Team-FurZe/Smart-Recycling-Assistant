# main.py
# ----------------------------------------
# FastAPI-based API for Smart Recycle Assistant
# Loads model_finetuned.h5 and predicts waste category
# ----------------------------------------

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io
import os

# 🔹 Initialize FastAPI app
app = FastAPI(title="Smart Recycle Assistant API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

# 🔹 Model and class labels
MODEL_PATH = "models/ai-model-1/model_finetuned.h5"
CLASS_NAMES = [
    "battery", "biological", "cardboard", "clothes",
    "glass", "metal", "paper", "plastic", "shoes", "trash"
]

THRESHOLD = 0.4

# 🔹 Load model once at startup
print("🚀 Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Model loaded successfully!")

# 🔹 Waste type → bin color map
BIN_COLORS = {
    "plastic": "blue",
    "paper": "blue",
    "metal": "yellow",
    "glass": "green",
    "cardboard": "blue",
    "biological": "brown",
    "battery": "red",
    "trash": "gray",
    "clothes": "pink",
    "shoes": "pink"
}


@app.get("/")
async def home():
    """Health check endpoint."""
    return {"message": "Smart Recycle Assistant API is running 🚀"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Receive image, classify, and return waste type with confidence."""
    try:
        # 🔹 Read image bytes
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img = img.resize((224, 224))

        # 🔹 Preprocess
        img_array = np.expand_dims(np.array(img) / 255.0, axis=0)

        # 🔹 Predict
        preds = model.predict(img_array)
        predicted_class = CLASS_NAMES[np.argmax(preds[0])]
        confidence = float(np.max(preds[0]))
        
        # 🔹 Check confidence threshold
        if confidence < THRESHOLD:
            return JSONResponse({
                "detected": False,
                "class": "unknown",
                "message": "No waste detected",
                "confidence": round(confidence, 3),
                "bin_color": "unknown"
            })

        bin_color = BIN_COLORS.get(predicted_class, "unknown")

        return JSONResponse({
            "detected": True,
            "class": predicted_class,
            "confidence": round(confidence, 3),
            "bin_color": bin_color
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🔹 Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

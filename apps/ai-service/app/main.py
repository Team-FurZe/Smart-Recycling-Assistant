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
import json  # ✅ NEW

# 🔹 Initialize FastAPI app
app = FastAPI(title="Smart Recycle Assistant API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

# 🔹 Model and class labels
# 👉 Burayı kendi model dosyana göre ayarla:
# Örn: "models/ai-model-1/model_finetuned.h5" ya da "models/ai-model-1/model_2.h5"
MODEL_PATH = "models/ai-model-1/model_finetuned_1.h5"
CLASS_INDICES_PATH = "models/src/class_indices.json"

# 🔹 Confidence threshold (opsiyonel, yedek mekanizma)
THRESHOLD = 0.6  # istersen sonra 0.5 / 0.7 diye ayarlarsın

# 🔹 Load class indices and build CLASS_NAMES list dynamically
# class_indices: {"battery": 0, "biological": 1, ..., "no_waste": 6, ...}
with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
    class_indices = json.load(f)

# index sırasına göre class listesi oluştur
# Örn: [ "battery", "biological", ..., "trash" ]
CLASS_NAMES = [name for name, idx in sorted(class_indices.items(), key=lambda x: x[1])]

print("📚 Loaded CLASS_NAMES:", CLASS_NAMES)

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
    # "no_waste" için kutu rengi yok; zaten çöp değil 🙂
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
        probs = preds[0]  # shape: (num_classes,)

        # 🔹 Build probabilities dict for all classes
        probabilities = {
            CLASS_NAMES[i]: float(probs[i])
            for i in range(len(CLASS_NAMES))
        }

        # 🔹 Get top prediction
        confidence_max = float(np.max(probs))
        predicted_index = int(np.argmax(probs))
        predicted_class = CLASS_NAMES[predicted_index]

        # 1) If model clearly predicts "no_waste"
        if predicted_class == "no_waste":
            return JSONResponse({
                "detected": False,
                "class": "no_waste",
                "message": "Bu görüntüde belirgin bir çöp algılamadım.",
                "confidence": round(confidence_max, 3),
                "probabilities": probabilities  # ✅ NEW
            })

        # 2) If model is uncertain (low confidence)
        if confidence_max < THRESHOLD:
            return JSONResponse({
                "detected": False,
                "class": "uncertain",
                "message": "Burada belirgin bir çöp algılayamadım (model emin değil).",
                "confidence": round(confidence_max, 3),
                "probabilities": probabilities  # ✅ NEW
            })

        # 3) Normal case: detected a waste type
        bin_color = BIN_COLORS.get(predicted_class, "unknown")

        return JSONResponse({
            "detected": True,
            "class": predicted_class,
            "confidence": round(confidence_max, 3),
            "bin_color": bin_color,
            "probabilities": probabilities  # ✅ NEW
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# 🔹 Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# predict_api.py
# ----------------------------------------
# Flask-based API for Smart Recycle Assistant
# Loads model_finetuned.h5 and predicts waste category
# ----------------------------------------

from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os

app = Flask(__name__)

# 🔹 Model and class labels
MODEL_PATH = "../ai-model-1/model_finetuned.h5"
CLASS_NAMES = ['battery', 'biological', 'cardboard', 'clothes', 'glass', 'metal', 'paper', 'plastic', 'shoes', 'trash']

# 🔹 Load model once
model = load_model(MODEL_PATH)
print("✅ Model loaded successfully!")

# 🔹 Helper: Map waste type to bin color
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

@app.route("/")
def home():
    return jsonify({"message": "Smart Recycle Assistant API is running 🚀"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # 🔹 Save and preprocess the image
        img_path = os.path.join("temp.jpg")
        file.save(img_path)

        img = image.load_img(img_path, target_size=(224, 224))
        img_array = np.expand_dims(image.img_to_array(img) / 255.0, axis=0)

        # 🔹 Predict
        preds = model.predict(img_array)
        predicted_class = CLASS_NAMES[np.argmax(preds[0])]
        confidence = float(np.max(preds[0]))

        bin_color = BIN_COLORS.get(predicted_class, "unknown")

        # 🔹 Cleanup temp
        os.remove(img_path)

        return jsonify({
            "class": predicted_class,
            "confidence": round(confidence, 3),
            "bin_color": bin_color
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)

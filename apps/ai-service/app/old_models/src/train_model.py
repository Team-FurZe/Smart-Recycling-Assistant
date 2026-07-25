# train_model.py (Optimized Version)
# -------------------------------------------
# Goal: Increase model accuracy using Transfer Learning (MobileNetV2)
# Dataset: data/processed/train, val, test
# Output: model_optimized.h5
# -------------------------------------------

import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
import json

# ⚙️ Parameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 30

# 📁 Dataset paths
BASE_DIR = "C:/Projects/Smart Recycling Assistant/Dataset/garbage-dataset/processed"
TRAIN_DIR = os.path.join(BASE_DIR, "train")
VAL_DIR = os.path.join(BASE_DIR, "val")
TEST_DIR = os.path.join(BASE_DIR, "test")

# 🧩 Data Augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.3,
    brightness_range=[0.6, 1.4],
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)
test_datagen = ImageDataGenerator(rescale=1./255)

# 📦 Load data
train_data = train_datagen.flow_from_directory(
    TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical'
)
val_data = val_datagen.flow_from_directory(
    VAL_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical'
)
test_data = test_datagen.flow_from_directory(
    TEST_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical'
)

# Save class indices for inference (mapping class_name -> index)
print("📚 Class indices:", train_data.class_indices)

with open("class_indices.json", "w") as f:
    json.dump(train_data.class_indices, f)

print("✅ Saved class_indices.json")


# 🧠 Base Model (Transfer Learning)
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze base layers for first training

# 🧱 Model Architecture
model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(256, activation='relu'),
    Dropout(0.4),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(train_data.num_classes, activation='softmax')
])

# 🧠 Compile Model
model.compile(
    optimizer=Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 🚀 Train Model
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS
)


# train_model.py'nin bulunduğu klasörü baz al
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

# ../ai-model-1 klasörünü hedefle
MODEL_DIR = os.path.normpath(os.path.join(THIS_DIR, "..", "ai-model-1"))

os.makedirs(MODEL_DIR, exist_ok=True)  # yoksa oluştur

MODEL_OPTIMIZED_PATH = os.path.join(MODEL_DIR, "model_optimized_1.h5")


# 💾 Save Model
model.save(MODEL_OPTIMIZED_PATH)
print("✅ Optimized model saved as model_optimized_1.h5")

# 📊 Plot Training Results
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Acc')
plt.plot(history.history['val_accuracy'], label='Val Acc')
plt.title('Model Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Model Loss')
plt.legend()

plt.tight_layout()
plt.show()

# 🧠 Optional Fine-tuning Step (Unfreeze last layers)
print("\n🔁 Fine-tuning the model for higher accuracy...")
base_model.trainable = True
model.compile(
    optimizer=Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

fine_tune_history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=10
)

MODEL_FINETUNED_PATH = os.path.join(MODEL_DIR, "model_finetuned_1.h5")  
model.save(MODEL_FINETUNED_PATH)
print("🎯 Fine-tuned model saved as model_finetuned_1.h5")

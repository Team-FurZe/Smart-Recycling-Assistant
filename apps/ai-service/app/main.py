from fastapi import FastAPI, UploadFile, File

app = FastAPI(title="SRA AI Service")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # TODO: read bytes, preprocess, model inference
    # Stub response:
    return {"label": "plastic", "confidence": 0.87}

from pathlib import Path
import torch

from ultralytics import YOLO


def get_device() -> str:
    """
    Select the best available device automatically.
    """
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def train_yolo():
    """
    Main training function.
    Edit the configuration values below when needed.
    """

    # =========================================================
    # Training configuration
    # =========================================================

    # Write the merged dataset yaml path manually here.
    data_yaml_path = r"C:\Projects\Smart Recycling Assistant\Dataset\merged_garbage_dataset\data.yaml"

    epochs = 100
    imgsz = 640
    batch = 16
    model_name = "yolo11n.pt"
    run_name = "merged_garbage_training_v1"
    project_dir = "yolo_runs"
    workers = 8
    patience = 20
    cache = False

    print("=" * 70)
    print("YOLO TRAINING SCRIPT STARTED")
    print("=" * 70)
    print("[STEP 1] Checking dataset yaml path...")
    print(f"[INFO] Dataset yaml path: {data_yaml_path}")
    print()

    data_yaml_file = Path(data_yaml_path)

    if not data_yaml_file.exists():
        print("[ERROR] Dataset yaml file was not found.")
        print("[ERROR] Please run merge_dataset.py first or check the path.")
        print("=" * 70)
        return

    print("[INFO] Dataset yaml file found successfully.")
    print()

    device = get_device()

    print("[STEP 2] Training configuration")
    print(f"[INFO] Model: {model_name}")
    print(f"[INFO] Epochs: {epochs}")
    print(f"[INFO] Image size: {imgsz}")
    print(f"[INFO] Batch size: {batch}")
    print(f"[INFO] Workers: {workers}")
    print(f"[INFO] Patience: {patience}")
    print(f"[INFO] Cache: {cache}")
    print(f"[INFO] Device: {device}")
    print(f"[INFO] Project directory: {project_dir}")
    print(f"[INFO] Run name: {run_name}")
    print()

    print("[STEP 3] Loading model...")
    model = YOLO(model_name)
    print("[INFO] Model loaded successfully.")
    print()

    print("[STEP 4] Starting training...")
    print("=" * 70)

    results = model.train(
        data=str(data_yaml_file),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project_dir,
        name=run_name,
        workers=workers,
        patience=patience,
        device=device,
        pretrained=True,
        cache=cache,
        verbose=True,
    )

    print("=" * 70)
    print("TRAINING FINISHED")
    print("=" * 70)

    weights_dir = Path(project_dir) / run_name / "weights"
    best_path = weights_dir / "best.pt"
    last_path = weights_dir / "last.pt"

    print(f"[INFO] Training results object: {results}")
    print(f"[INFO] Weights directory: {weights_dir}")

    if best_path.exists():
        print(f"[SUCCESS] Best model saved at: {best_path}")
    else:
        print("[WARNING] best.pt not found.")

    if last_path.exists():
        print(f"[SUCCESS] Last model saved at: {last_path}")
    else:
        print("[WARNING] last.pt not found.")

    print("=" * 70)


if __name__ == "__main__":
    train_yolo()
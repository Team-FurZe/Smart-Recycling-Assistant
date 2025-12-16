from pathlib import Path

import torch
from ultralytics import YOLO


def find_project_root(start: Path) -> Path:
    """
    Walk up the directory tree until we find a folder that has both:
    - 'Smart-Recycling-Assistant' (this repo)
    - 'Dataset' (your datasets folder) as children.

    This makes the script work on both Windows and macOS even if the absolute
    path is different.
    """
    current = start

    # Limit to avoid an infinite loop (e.g. in case of weird FS)
    for _ in range(10):
        # current is some directory like .../root/Smart-Recycling-Assistant/apps/ai-service/app/model/src
        # We want to find the parent that has BOTH:
        #   Smart-Recycling-Assistant/
        #   Dataset/
        smart_dir = current / "Smart-Recycling-Assistant"
        dataset_dir = current / "Dataset"

        if smart_dir.exists() and dataset_dir.exists():
            return current

        # go one level up
        current = current.parent

    raise RuntimeError("Could not find project root containing 'Smart-Recycling-Assistant' and 'Dataset' folders.")


def get_paths():
    """
    Resolve important paths in a cross-platform way (Windows + macOS).

    Assumes folder structure like:

    root/
      Dataset/
        multiple_garbage_detection/
          data.yaml
      Smart-Recycling-Assistant/
        apps/
          ai-service/
            app/
              model/
                src/
                  train_yolo.py
    """
    this_file = Path(__file__).resolve()          # .../Smart-Recycling-Assistant/apps/ai-service/app/model/src/train_yolo.py
    src_dir = this_file.parent                    # .../src
    # root is the folder that contains BOTH Dataset/ and Smart-Recycling-Assistant/
    root_dir = find_project_root(src_dir)

    # ai-service directory (we may want to put runs inside here)
    ai_service_dir = root_dir / "Smart-Recycling-Assistant" / "apps" / "ai-service"

    # dataset yaml: <root>/Dataset/multiple_garbage_detection/data.yaml
    data_yaml = root_dir / "Dataset" / "multiple_garbage_detection" / "data.yaml"

    # where to save YOLO training runs (inside ai-service)
    runs_dir = ai_service_dir / "yolo_runs"

    return {
        "root_dir": root_dir,
        "ai_service_dir": ai_service_dir,
        "data_yaml": data_yaml,
        "runs_dir": runs_dir,
    }


def train_yolo():
    paths = get_paths()
    data_yaml = paths["data_yaml"]
    runs_dir = paths["runs_dir"]

    print("== YOLO Training Configuration ==")
    print(f"Root Dir : {paths['root_dir']}")
    print(f"Data YAML: {data_yaml}")
    print(f"Runs Dir : {runs_dir}")
    print("--------------------------------")

    if not data_yaml.exists():
        raise FileNotFoundError(f"data.yaml not found at: {data_yaml}")

    # Select device automatically
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load base YOLO model (smallest, fastest variant)
    model = YOLO("yolov8n.pt")

    # Train
    results = model.train(
        data=str(data_yaml),
        epochs=50,           # you can change this (e.g. 30)
        imgsz=640,
        project=str(runs_dir),
        name="v1",
        device=device,
    )

    print("Training finished.")
    print(f"Results saved to: {runs_dir / 'v1'}")
    return results


def main():
    train_yolo()


if __name__ == "__main__":
    main()

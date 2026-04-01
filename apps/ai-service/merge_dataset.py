from pathlib import Path
import shutil
from collections import defaultdict
import yaml


# =========================================================
# Global configuration
# =========================================================

# Final class list for the merged dataset.
# "Electronics" will not be used in the final model.
GLOBAL_CLASSES = [
    "BIODEGRADABLE",
    "CARDBOARD",
    "GLASS",
    "METAL",
    "PAPER",
    "PLASTIC",
]

# Source dataset locations and class mappings
DATASET_CONFIGS = {
    "Garbage_dataset_PlusYaml": {
        "root": Path(r"C:\Projects\Smart Recycling Assistant\Dataset\Garbage_dataset_PlusYaml"),
        "splits": {
            "train": ("train/images", "train/labels"),
            "val": ("valid/images", "valid/labels"),
            "test": ("test/images", "test/labels"),
        },
        "map_to_global": {
            0: "PAPER",           # Paper
            1: "PLASTIC",         # Plastic
            2: "GLASS",           # Glass
            3: "METAL",           # Metal
            4: "BIODEGRADABLE",   # Organic -> BIODEGRADABLE
            5: None,              # Electronics -> ignore
        },
    },
    "multiple_garbage_detection": {
        "root": Path(r"C:\Projects\Smart Recycling Assistant\Dataset\multiple_garbage_detection"),
        "splits": {
            "train": ("train/images", "train/labels"),
            "val": ("valid/images", "valid/labels"),
            "test": ("test/images", "test/labels"),
        },
        "map_to_global": {
            0: "BIODEGRADABLE",
            1: "CARDBOARD",
            2: "GLASS",
            3: "METAL",
            4: "PAPER",
            5: "PLASTIC",
        },
    },
}

# Output merged dataset location
MERGED_DATASET_ROOT = Path(r"C:\Projects\Smart Recycling Assistant\Dataset\merged_garbage_dataset")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


# =========================================================
# Helper functions
# =========================================================

def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def clear_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def get_global_index_map() -> dict[str, int]:
    return {class_name: idx for idx, class_name in enumerate(GLOBAL_CLASSES)}


def print_class_distribution(title: str, class_counter: dict[str, int]) -> None:
    print("-" * 70)
    print(title)
    print("-" * 70)

    total = sum(class_counter.values())
    print(f"[INFO] Total annotations counted: {total}")

    for class_name in GLOBAL_CLASSES:
        count = class_counter.get(class_name, 0)
        print(f"[INFO] {class_name:<16}: {count}")

    print("-" * 70)
    print()


def remap_label_file(
    src_label_path: Path,
    dst_label_path: Path,
    class_map: dict[int, str | None],
    global_index_map: dict[str, int]
) -> tuple[int, int, dict[str, int]]:
    """
    Read one YOLO label file, remap class ids into global class ids,
    skip ignored classes, and write the new label file.

    Returns:
        kept_count
        ignored_count
        class_counter_for_this_file
    """
    kept_lines = []
    kept_count = 0
    ignored_count = 0
    class_counter = defaultdict(int)

    if not src_label_path.exists():
        return 0, 0, class_counter

    with src_label_path.open("r", encoding="utf-8") as f:
        lines = f.readlines()

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        parts = line.split()

        # Standard YOLO detection format:
        # class_id x_center y_center width height
        if len(parts) < 5:
            continue

        try:
            local_class_id = int(parts[0])
        except ValueError:
            continue

        bbox_values = parts[1:]

        if local_class_id not in class_map:
            ignored_count += 1
            continue

        mapped_class_name = class_map[local_class_id]

        # Ignore unwanted classes such as Electronics
        if mapped_class_name is None:
            ignored_count += 1
            continue

        global_class_id = global_index_map[mapped_class_name]
        kept_lines.append(" ".join([str(global_class_id), *bbox_values]))

        kept_count += 1
        class_counter[mapped_class_name] += 1

    # Only write label file if there is at least one valid annotation
    if kept_lines:
        with dst_label_path.open("w", encoding="utf-8") as f:
            f.write("\n".join(kept_lines) + "\n")

    return kept_count, ignored_count, class_counter


def write_data_yaml(output_root: Path) -> Path:
    """
    Create the merged YOLO data.yaml file.
    """
    yaml_path = output_root / "data.yaml"

    data = {
        "path": str(output_root),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(GLOBAL_CLASSES),
        "names": GLOBAL_CLASSES,
    }

    with yaml_path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)

    return yaml_path


# =========================================================
# Main merge function
# =========================================================

def build_merged_dataset(selected_datasets: list[str] | None = None) -> Path:
    """
    Merge selected datasets into a single YOLO dataset.
    """
    if selected_datasets is None:
        selected_datasets = list(DATASET_CONFIGS.keys())

    print("=" * 70)
    print("MERGED DATASET PREPARATION STARTED")
    print("=" * 70)
    print(f"[INFO] Selected datasets: {selected_datasets}")
    print(f"[INFO] Output folder: {MERGED_DATASET_ROOT}")
    print(f"[INFO] Final classes: {GLOBAL_CLASSES}")
    print()

    # Recreate merged dataset folder from scratch
    clear_dir(MERGED_DATASET_ROOT)

    for split in ["train", "val", "test"]:
        ensure_dir(MERGED_DATASET_ROOT / split / "images")
        ensure_dir(MERGED_DATASET_ROOT / split / "labels")

    global_index_map = get_global_index_map()

    total_images_copied = 0
    total_labels_written = 0
    total_annotations_kept = 0
    total_annotations_ignored = 0
    total_images_skipped = 0
    final_class_distribution = defaultdict(int)

    for dataset_name in selected_datasets:
        if dataset_name not in DATASET_CONFIGS:
            raise ValueError(f"[ERROR] Unknown dataset name: {dataset_name}")

        config = DATASET_CONFIGS[dataset_name]
        dataset_root = config["root"]
        class_map = config["map_to_global"]

        print("=" * 70)
        print(f"[INFO] Processing dataset: {dataset_name}")
        print(f"[INFO] Dataset root: {dataset_root}")
        print("=" * 70)

        dataset_images_copied = 0
        dataset_labels_written = 0
        dataset_annotations_kept = 0
        dataset_annotations_ignored = 0
        dataset_images_skipped = 0
        dataset_class_distribution = defaultdict(int)

        for split_name, (images_rel, labels_rel) in config["splits"].items():
            src_images_dir = dataset_root / images_rel
            src_labels_dir = dataset_root / labels_rel

            dst_images_dir = MERGED_DATASET_ROOT / split_name / "images"
            dst_labels_dir = MERGED_DATASET_ROOT / split_name / "labels"

            print()
            print(f"[INFO] Split: {split_name}")
            print(f"[INFO] Images folder: {src_images_dir}")
            print(f"[INFO] Labels folder: {src_labels_dir}")

            if not src_images_dir.exists():
                print(f"[WARNING] Missing images folder: {src_images_dir}")
                continue

            if not src_labels_dir.exists():
                print(f"[WARNING] Missing labels folder: {src_labels_dir}")
                continue

            split_total_images = 0
            split_images_copied = 0
            split_annotations_kept = 0
            split_annotations_ignored = 0
            split_images_skipped = 0

            for image_path in src_images_dir.iterdir():
                if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                    continue

                split_total_images += 1

                stem = image_path.stem
                src_label_path = src_labels_dir / f"{stem}.txt"

                # Prefix dataset name to avoid filename collisions
                new_stem = f"{dataset_name}__{stem}"

                dst_image_path = dst_images_dir / f"{new_stem}{image_path.suffix.lower()}"
                dst_label_path = dst_labels_dir / f"{new_stem}.txt"

                kept_count, ignored_count, file_class_distribution = remap_label_file(
                    src_label_path=src_label_path,
                    dst_label_path=dst_label_path,
                    class_map=class_map,
                    global_index_map=global_index_map,
                )

                # If image has no valid label after remapping, skip copying it
                if kept_count == 0:
                    split_images_skipped += 1
                    split_annotations_ignored += ignored_count
                    continue

                shutil.copy2(image_path, dst_image_path)

                split_images_copied += 1
                split_annotations_kept += kept_count
                split_annotations_ignored += ignored_count

                for class_name, count in file_class_distribution.items():
                    dataset_class_distribution[class_name] += count
                    final_class_distribution[class_name] += count

            print(f"[INFO] Total images scanned     : {split_total_images}")
            print(f"[INFO] Images copied           : {split_images_copied}")
            print(f"[INFO] Images skipped          : {split_images_skipped}")
            print(f"[INFO] Annotations kept        : {split_annotations_kept}")
            print(f"[INFO] Annotations ignored     : {split_annotations_ignored}")

            dataset_images_copied += split_images_copied
            dataset_labels_written += split_images_copied
            dataset_annotations_kept += split_annotations_kept
            dataset_annotations_ignored += split_annotations_ignored
            dataset_images_skipped += split_images_skipped

        print()
        print(f"[SUMMARY] Dataset completed: {dataset_name}")
        print(f"[SUMMARY] Images copied       : {dataset_images_copied}")
        print(f"[SUMMARY] Label files written : {dataset_labels_written}")
        print(f"[SUMMARY] Annotations kept    : {dataset_annotations_kept}")
        print(f"[SUMMARY] Annotations ignored : {dataset_annotations_ignored}")
        print(f"[SUMMARY] Images skipped      : {dataset_images_skipped}")
        print()

        print_class_distribution(
            title=f"CLASS DISTRIBUTION FOR DATASET: {dataset_name}",
            class_counter=dataset_class_distribution
        )

        total_images_copied += dataset_images_copied
        total_labels_written += dataset_labels_written
        total_annotations_kept += dataset_annotations_kept
        total_annotations_ignored += dataset_annotations_ignored
        total_images_skipped += dataset_images_skipped

    yaml_path = write_data_yaml(MERGED_DATASET_ROOT)

    print("=" * 70)
    print("MERGED DATASET PREPARATION FINISHED")
    print("=" * 70)
    print(f"[FINAL] Merged dataset path     : {MERGED_DATASET_ROOT}")
    print(f"[FINAL] data.yaml path         : {yaml_path}")
    print(f"[FINAL] Total copied images    : {total_images_copied}")
    print(f"[FINAL] Total written labels   : {total_labels_written}")
    print(f"[FINAL] Total kept annotations : {total_annotations_kept}")
    print(f"[FINAL] Total ignored annots   : {total_annotations_ignored}")
    print(f"[FINAL] Total skipped images   : {total_images_skipped}")
    print()

    print_class_distribution(
        title="FINAL MERGED CLASS DISTRIBUTION",
        class_counter=final_class_distribution
    )

    return yaml_path


if __name__ == "__main__":
    build_merged_dataset(
        selected_datasets=[
            "Garbage_dataset_PlusYaml",
            "multiple_garbage_detection",
        ]
    )
import os
import shutil
import random

RAW_DATA_DIR = "data/raw"
PROCESSED_DATA_DIR = "data/processed"

TRAIN_SPLIT = 0.7
VAL_SPLIT = 0.2
TEST_SPLIT = 0.1

def get_class_names(raw_dir):
    # Only directories (not files); each dir is a class label
    return [d for d in os.listdir(raw_dir) if os.path.isdir(os.path.join(raw_dir, d))]

def get_images_in_class(class_dir):
    # Only image files (common image extensions)
    IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp')
    return [f for f in os.listdir(class_dir) if os.path.isfile(os.path.join(class_dir, f)) and f.lower().endswith(IMAGE_EXTS)]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def split_and_copy():
    classes = get_class_names(RAW_DATA_DIR)
    splits = ['train', 'val', 'test']

    for split in splits:
        split_dir = os.path.join(PROCESSED_DATA_DIR, split)
        ensure_dir(split_dir)

    for class_name in classes:
        raw_class_dir = os.path.join(RAW_DATA_DIR, class_name)
        images = get_images_in_class(raw_class_dir)
        random.shuffle(images)

        n_total = len(images)
        n_train = int(n_total * TRAIN_SPLIT)
        n_val = int(n_total * VAL_SPLIT)
        n_test = n_total - n_train - n_val  # Ensures all images are used

        split_indices = {
            'train': (0, n_train),
            'val': (n_train, n_train + n_val),
            'test': (n_train + n_val, n_total)
        }

        for split in splits:
            split_dir = os.path.join(PROCESSED_DATA_DIR, split, class_name)
            ensure_dir(split_dir)
            start_idx, end_idx = split_indices[split]
            for img_name in images[start_idx:end_idx]:
                src = os.path.join(raw_class_dir, img_name)
                dst = os.path.join(split_dir, img_name)
                shutil.copy2(src, dst)

if __name__ == "__main__":
    split_and_copy()

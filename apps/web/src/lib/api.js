export async function predictImage(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/predict`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Predict failed");
    return res.json(); // { label, confidence, binColor, tips[] }
  }
  
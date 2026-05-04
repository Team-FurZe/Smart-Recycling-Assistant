const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export async function loginUser(payload) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(text || "Login failed");
    }

    return text ? JSON.parse(text) : {};
}

export async function signupUser(payload) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(text || "Signup failed");
    }

    return text ? JSON.parse(text) : {};
}

export async function predictImage(file, token) {
    const form = new FormData();
    form.append("file", file);

    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/predict`, {
        method: "POST",
        headers,
        body: form,
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(text || "Predict failed");
    }

    return text ? JSON.parse(text) : {};
}

export async function getMyHistory(token) {
    const res = await fetch(`${BACKEND_URL}/api/v1/history/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(text || "History request failed");
    }

    return text ? JSON.parse(text) : [];
}
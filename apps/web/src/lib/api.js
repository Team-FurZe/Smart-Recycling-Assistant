const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

async function parseResponse(res, fallback) {
    const text = await res.text();

    if (!res.ok) {
        let errorBody = null;

        try {
            errorBody = JSON.parse(text);
        } catch {
            errorBody = null;
        }

        throw new Error(errorBody?.message || errorBody?.error || text || fallback);
    }

    return text ? JSON.parse(text) : {};
}

export async function loginUser(payload) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseResponse(res, "Login failed");
}

export async function signupUser(payload) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseResponse(res, "Signup failed");
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

    return parseResponse(res, "Predict failed");
}

export async function getMyHistory(token) {
    const res = await fetch(`${BACKEND_URL}/api/v1/history/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await parseResponse(res, "History request failed");
    return Array.isArray(data) ? data : [];
}

export async function updateProfile(payload, token) {
    const res = await fetch(`${BACKEND_URL}/api/v1/account/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return parseResponse(res, "Profile update failed");
}

export async function changePassword(payload, token) {
    const res = await fetch(`${BACKEND_URL}/api/v1/account/password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    await parseResponse(res, "Password change failed");
}

export async function clearMyHistory(token) {
    const res = await fetch(`${BACKEND_URL}/api/v1/history/me`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    await parseResponse(res, "Clear history failed");
}

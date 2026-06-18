const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const AUTH_LOGIN_URL = `${BACKEND_URL}/api/v1/auth/login`;
const AUTH_SIGNUP_URL = `${BACKEND_URL}/api/v1/auth/signup`;
const ACCOUNT_PROFILE_URL = `${BACKEND_URL}/api/v1/account/profile`;
const ACCOUNT_PASSWORD_URL = `${BACKEND_URL}/api/v1/account/password`;
const HISTORY_URL = `${BACKEND_URL}/api/v1/history/me`;
const PREDICT_URL = `${BACKEND_URL}/api/v1/predict`;
const PREDICT_LIVE_URL = `${BACKEND_URL}/api/v1/predict/live`;
const REQUEST_TIMEOUT_MS = 12000;

async function parseJsonResponse(res) {
    const text = await res.text();

    if (!res.ok) {
        let errorBody = null;

        try {
            errorBody = JSON.parse(text);
        } catch {
            errorBody = null;
        }

        throw new Error(errorBody?.message || errorBody?.error || text || `HTTP ${res.status}`);
    }

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("Response is not valid JSON.");
    }
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } catch (e) {
        if (e.name === "AbortError") {
            throw new Error(
                `Request timed out. Check that the backend is running and reachable at ${BACKEND_URL}.`
            );
        }

        throw e;
    } finally {
        clearTimeout(timeout);
    }
}

export async function loginUser(payload) {
    const res = await fetchWithTimeout(AUTH_LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function signupUser(payload) {
    const res = await fetchWithTimeout(AUTH_SIGNUP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function getMyHistory(token) {
    const res = await fetchWithTimeout(HISTORY_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return parseJsonResponse(res);
}

export async function predictImageFromUri(uri, token, options = {}) {
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }

    const formData = new FormData();
    formData.append("file", {
        uri,
        name: "frame.jpg",
        type: "image/jpeg",
    });

    const res = await fetchWithTimeout(PREDICT_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: options.signal,
    });

    return parseJsonResponse(res);
}

export async function updateProfile(payload, token) {
    const res = await fetchWithTimeout(ACCOUNT_PROFILE_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function changePassword(payload, token) {
    const res = await fetchWithTimeout(ACCOUNT_PASSWORD_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
}

export async function clearMyHistory(token) {
    const res = await fetchWithTimeout(HISTORY_URL, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return parseJsonResponse(res);
}

export async function predictLiveImageFromUri(uri, token, options = {}) {
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }

    const formData = new FormData();
    formData.append("file", {
        uri,
        name: "live-frame.jpg",
        type: "image/jpeg",
    });

    const res = await fetch(PREDICT_LIVE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: options.signal,
    });

    return parseJsonResponse(res);
}

export { BACKEND_URL };

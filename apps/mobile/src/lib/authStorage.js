import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "sra_mobile_token";
const USER_KEY = "sra_mobile_user";

export async function saveAuth(token, user) {
    await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(user || {})],
    ]);
}

export async function saveAuthResponse(authResponse) {
    const token = authResponse?.token || authResponse?.accessToken || authResponse?.jwt;
    const user = authResponse?.user || {
        userId: authResponse?.userId,
        username: authResponse?.username,
        email: authResponse?.email,
    };

    if (!token) {
        throw new Error("Token not found in auth response.");
    }

    await saveAuth(token, user);
}

export async function getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export async function clearAuth() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

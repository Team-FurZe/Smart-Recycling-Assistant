import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "sra_token";
const USER_KEY = "sra_user";

export async function saveAuth(token, user) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user || null));
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
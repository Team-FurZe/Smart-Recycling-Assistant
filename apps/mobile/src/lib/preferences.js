import AsyncStorage from "@react-native-async-storage/async-storage";

export const SETTINGS_KEY = "sra_mobile_settings";

export const defaultSettings = {
    theme: "system",
    language: "en",
    autoScan: true,
    flashDefault: false,
    notifications: true,
};

export async function readSettings() {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
}

export async function saveSettings(settings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resolveTheme(theme) {
    return theme === "dark" ? "dark" : "light";
}

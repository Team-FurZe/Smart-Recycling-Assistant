export const SETTINGS_STORAGE_KEY = "sra_user_settings";

export const defaultSettings = {
    theme: "system",
    language: "en",
    autoScan: true,
    flashDefault: false,
    notifications: true,
};

export function readSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
        return defaultSettings;
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("sra-settings-change"));
}

export function applyTheme(theme) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
}

export function applyStoredTheme() {
    const settings = readSettings();
    const systemDark =
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

    applyTheme(settings.theme === "system" && systemDark ? "dark" : settings.theme);
}

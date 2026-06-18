import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    changePassword,
    clearMyHistory,
    updateProfile,
} from "../lib/api";
import { getToken, getUser, saveAuthResponse } from "../lib/authStorage";
import {
    defaultSettings,
    readSettings,
    resolveTheme,
    saveSettings,
} from "../lib/preferences";

const copy = {
    en: {
        title: "User Settings",
        subtitle: "Manage account preferences, camera defaults, history, and app details.",
        account: "Account",
        displayName: "Display name",
        email: "Email",
        editProfile: "Edit Profile",
        profileSaved: "Profile updated.",
        currentPassword: "Current password",
        newPassword: "New password",
        confirmPassword: "Confirm password",
        changePassword: "Change Password",
        passwordLength: "New password must be at least 6 characters.",
        passwordMismatch: "New password and confirmation do not match.",
        passwordSaved: "Password changed.",
        appearance: "Appearance",
        theme: "Theme",
        themeDescription: "Choose how the interface should look.",
        system: "System",
        light: "Light",
        dark: "Dark",
        language: "Language",
        languageChoice: "Turkish / English",
        currentLanguage: "Current language",
        turkish: "Turkish",
        english: "English",
        camera: "Camera",
        autoScan: "Auto Scan",
        autoScanDescription: "Start detection automatically when camera input is ready.",
        flashDefault: "Flash Default",
        flashDefaultDescription: "Use flash as the default camera mode.",
        history: "History",
        viewHistory: "View History",
        viewHistoryDescription: "Open the prediction history screen.",
        clearHistory: "Clear History",
        clearHistoryDescription: "Remove saved prediction records from your account.",
        clearConfirm: "Delete all prediction history for your account?",
        historyCleared: "History cleared.",
        notifications: "Notifications",
        enableNotifications: "Enable Notifications",
        notificationsDescription: "Receive updates about scans and reminders.",
        about: "About",
        version: "Version",
        privacyPolicy: "Privacy Policy",
        privacyDescription: "Read how app data is handled.",
        privacyText:
            "Smart Recycle Assistant uses uploaded images to run waste detection and show prediction history. Account and scan data is used to support recycling features.",
        open: "Open",
        view: "View",
        clear: "Clear",
        close: "Close",
        cancel: "Cancel",
        saving: "Saving...",
    },
    tr: {
        title: "Kullanici Ayarlari",
        subtitle: "Hesap tercihlerini, kamera varsayilanlarini, gecmisi ve uygulama bilgilerini yonet.",
        account: "Hesap",
        displayName: "Gorunen ad",
        email: "E-posta",
        editProfile: "Profili Duzenle",
        profileSaved: "Profil guncellendi.",
        currentPassword: "Mevcut sifre",
        newPassword: "Yeni sifre",
        confirmPassword: "Sifreyi onayla",
        changePassword: "Sifreyi Degistir",
        passwordLength: "Yeni sifre en az 6 karakter olmali.",
        passwordMismatch: "Yeni sifre ve onay eslesmiyor.",
        passwordSaved: "Sifre degistirildi.",
        appearance: "Gorunum",
        theme: "Tema",
        themeDescription: "Arayuzun nasil gorunecegini sec.",
        system: "Sistem",
        light: "Acik",
        dark: "Koyu",
        language: "Dil",
        languageChoice: "Turkce / Ingilizce",
        currentLanguage: "Mevcut dil",
        turkish: "Turkce",
        english: "Ingilizce",
        camera: "Kamera",
        autoScan: "Otomatik Tarama",
        autoScanDescription: "Kamera hazir oldugunda algilamayi otomatik baslat.",
        flashDefault: "Varsayilan Flash",
        flashDefaultDescription: "Flash modunu varsayilan kamera modu olarak kullan.",
        history: "Gecmis",
        viewHistory: "Gecmisi Goruntule",
        viewHistoryDescription: "Tahmin gecmisi ekranini ac.",
        clearHistory: "Gecmisi Temizle",
        clearHistoryDescription: "Hesabindaki kayitli tahminleri sil.",
        clearConfirm: "Hesabindaki tum tahmin gecmisi silinsin mi?",
        historyCleared: "Gecmis temizlendi.",
        notifications: "Bildirimler",
        enableNotifications: "Bildirimleri Etkinlestir",
        notificationsDescription: "Tarama ve hatirlatma guncellemelerini al.",
        about: "Hakkinda",
        version: "Versiyon",
        privacyPolicy: "Gizlilik Politikasi",
        privacyDescription: "Uygulama verilerinin nasil kullanildigini oku.",
        privacyText:
            "Smart Recycle Assistant, atik algilamayi calistirmak ve tahmin gecmisini gostermek icin yuklenen gorselleri kullanir. Hesap ve tarama verileri geri donusum ozelliklerini desteklemek icin kullanilir.",
        open: "Ac",
        view: "Gor",
        clear: "Temizle",
        close: "Kapat",
        cancel: "Vazgec",
        saving: "Kaydediliyor...",
    },
};

function getColors(theme) {
    const dark = theme === "dark";
    return {
        dark,
        page: dark ? "#0F1722" : "#F5F7FB",
        card: dark ? "#172235" : "#FFFFFF",
        nested: dark ? "#121C2D" : "#FBFDFF",
        border: dark ? "#2A3850" : "#E2E8F0",
        input: dark ? "#0F1722" : "#FFFFFF",
        text: dark ? "#F8FBFF" : "#142033",
        muted: dark ? "#B9C4D3" : "#607080",
        soft: dark ? "#263244" : "#EEF2F7",
        active: dark ? "#173A24" : "#E8F5E9",
    };
}

function SettingSection({ colors, marker, title, children }) {
    return (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeading}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.active }]}>
                    <Text style={styles.sectionIconText}>{marker}</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function SettingRow({ colors, label, description, children }) {
    return (
        <View style={[styles.row, { borderTopColor: colors.border }]}>
            <View style={styles.rowTextWrap}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                {description ? (
                    <Text style={[styles.rowDescription, { color: colors.muted }]}>
                        {description}
                    </Text>
                ) : null}
            </View>
            <View style={styles.rowAction}>{children}</View>
        </View>
    );
}

export default function SettingsScreen({ onNavigate, onPreferencesChange }) {
    const [settings, setSettings] = useState(defaultSettings);
    const [profile, setProfile] = useState({ name: "", email: "" });
    const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [savingAction, setSavingAction] = useState("");

    const t = copy[settings.language] || copy.en;
    const theme = resolveTheme(settings.theme);
    const colors = getColors(theme);

    useEffect(() => {
        async function loadSettings() {
            const [savedSettings, user] = await Promise.all([
                readSettings(),
                getUser(),
            ]);

            setSettings(savedSettings);
            onPreferencesChange?.(savedSettings);
            setProfile({
                name: user?.username || user?.fullName || user?.name || "",
                email: user?.email || "",
            });
        }

        loadSettings().catch(() => {});
    }, [onPreferencesChange]);

    const languageLabel = useMemo(
        () => (settings.language === "tr" ? t.turkish : t.english),
        [settings.language, t]
    );

    async function updateSetting(key, value) {
        const nextSettings = { ...settings, [key]: value };
        setSettings(nextSettings);
        onPreferencesChange?.(nextSettings);
        await saveSettings(nextSettings);
    }

    async function saveProfile() {
        setSavingAction("profile");

        try {
            const token = await getToken();
            const response = await updateProfile(
                {
                    username: profile.name.trim(),
                    email: profile.email.trim().toLowerCase(),
                },
                token
            );

            await saveAuthResponse(response);
            setProfile({
                name: response.username || "",
                email: response.email || "",
            });
            Alert.alert(t.editProfile, t.profileSaved);
        } catch (e) {
            Alert.alert(t.editProfile, e.message || "Profile update failed.");
        } finally {
            setSavingAction("");
        }
    }

    async function changeAccountPassword() {
        if (!password.next || password.next.length < 6) {
            Alert.alert(t.changePassword, t.passwordLength);
            return;
        }

        if (password.next !== password.confirm) {
            Alert.alert(t.changePassword, t.passwordMismatch);
            return;
        }

        setSavingAction("password");

        try {
            const token = await getToken();
            await changePassword(
                {
                    currentPassword: password.current,
                    newPassword: password.next,
                },
                token
            );
            setPassword({ current: "", next: "", confirm: "" });
            Alert.alert(t.changePassword, t.passwordSaved);
        } catch (e) {
            Alert.alert(t.changePassword, e.message || "Password change failed.");
        } finally {
            setSavingAction("");
        }
    }

    function clearHistory() {
        Alert.alert(t.clearHistory, t.clearConfirm, [
            { text: t.cancel, style: "cancel" },
            {
                text: t.clear,
                style: "destructive",
                onPress: async () => {
                    setSavingAction("history");
                    try {
                        const token = await getToken();
                        await clearMyHistory(token);
                        Alert.alert(t.clearHistory, t.historyCleared);
                    } catch (e) {
                        Alert.alert(t.clearHistory, e.message || "Clear history failed.");
                    } finally {
                        setSavingAction("");
                    }
                },
            },
        ]);
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.page }]}>
            <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>{t.subtitle}</Text>
            </View>

            <SettingSection colors={colors} marker="A" title={t.account}>
                <View style={[styles.form, { backgroundColor: colors.nested, borderColor: colors.border }]}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.displayName}</Text>
                    <TextInput
                        placeholderTextColor={colors.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.input,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        value={profile.name}
                        onChangeText={(value) =>
                            setProfile((current) => ({ ...current, name: value }))
                        }
                        placeholder={t.displayName}
                    />

                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.email}</Text>
                    <TextInput
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor={colors.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.input,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        value={profile.email}
                        onChangeText={(value) =>
                            setProfile((current) => ({ ...current, email: value }))
                        }
                        placeholder="you@example.com"
                    />

                    <Pressable
                        style={styles.primaryButton}
                        onPress={saveProfile}
                        disabled={savingAction === "profile"}
                    >
                        <Text style={styles.primaryButtonText}>
                            {savingAction === "profile" ? t.saving : t.editProfile}
                        </Text>
                    </Pressable>
                </View>

                <View style={[styles.form, { backgroundColor: colors.nested, borderColor: colors.border }]}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.currentPassword}</Text>
                    <TextInput
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.input,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        value={password.current}
                        onChangeText={(value) =>
                            setPassword((current) => ({ ...current, current: value }))
                        }
                    />

                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.newPassword}</Text>
                    <TextInput
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.input,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        value={password.next}
                        onChangeText={(value) =>
                            setPassword((current) => ({ ...current, next: value }))
                        }
                    />

                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.confirmPassword}</Text>
                    <TextInput
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.input,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        value={password.confirm}
                        onChangeText={(value) =>
                            setPassword((current) => ({ ...current, confirm: value }))
                        }
                    />

                    <Pressable
                        style={styles.primaryButton}
                        onPress={changeAccountPassword}
                        disabled={savingAction === "password"}
                    >
                        <Text style={styles.primaryButtonText}>
                            {savingAction === "password" ? t.saving : t.changePassword}
                        </Text>
                    </Pressable>
                </View>
            </SettingSection>

            <SettingSection colors={colors} marker="T" title={t.appearance}>
                <SettingRow colors={colors} label={t.theme} description={t.themeDescription}>
                    <View style={[styles.segmented, { backgroundColor: colors.soft }]}>
                        {[
                            ["system", t.system],
                            ["light", t.light],
                            ["dark", t.dark],
                        ].map(([value, label]) => (
                            <Pressable
                                key={value}
                                onPress={() => updateSetting("theme", value)}
                                style={[
                                    styles.segmentButton,
                                    settings.theme === value && { backgroundColor: colors.card },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.segmentButtonText,
                                        { color: settings.theme === value ? "#2E7D32" : colors.muted },
                                    ]}
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </SettingRow>
            </SettingSection>

            <SettingSection colors={colors} marker="L" title={t.language}>
                <SettingRow
                    colors={colors}
                    label={t.languageChoice}
                    description={`${t.currentLanguage}: ${languageLabel}`}
                >
                    <View style={[styles.segmented, { backgroundColor: colors.soft }]}>
                        {[
                            ["tr", t.turkish],
                            ["en", t.english],
                        ].map(([value, label]) => (
                            <Pressable
                                key={value}
                                onPress={() => updateSetting("language", value)}
                                style={[
                                    styles.segmentButton,
                                    settings.language === value && { backgroundColor: colors.card },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.segmentButtonText,
                                        {
                                            color:
                                                settings.language === value
                                                    ? "#2E7D32"
                                                    : colors.muted,
                                        },
                                    ]}
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </SettingRow>
            </SettingSection>

            <SettingSection colors={colors} marker="C" title={t.camera}>
                <SettingRow colors={colors} label={t.autoScan} description={t.autoScanDescription}>
                    <Switch
                        value={settings.autoScan}
                        onValueChange={(value) => updateSetting("autoScan", value)}
                        trackColor={{ false: "#CFD8E3", true: "#A5D6A7" }}
                        thumbColor={settings.autoScan ? "#2E7D32" : "#FFFFFF"}
                    />
                </SettingRow>

                <SettingRow
                    colors={colors}
                    label={t.flashDefault}
                    description={t.flashDefaultDescription}
                >
                    <Switch
                        value={settings.flashDefault}
                        onValueChange={(value) => updateSetting("flashDefault", value)}
                        trackColor={{ false: "#CFD8E3", true: "#A5D6A7" }}
                        thumbColor={settings.flashDefault ? "#2E7D32" : "#FFFFFF"}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection colors={colors} marker="H" title={t.history}>
                <SettingRow colors={colors} label={t.viewHistory} description={t.viewHistoryDescription}>
                    <Pressable style={[styles.secondaryButton, { backgroundColor: colors.soft }]} onPress={() => onNavigate?.("history")}>
                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.view}</Text>
                    </Pressable>
                </SettingRow>

                <SettingRow
                    colors={colors}
                    label={t.clearHistory}
                    description={t.clearHistoryDescription}
                >
                    <Pressable
                        style={styles.dangerButton}
                        onPress={clearHistory}
                        disabled={savingAction === "history"}
                    >
                        <Text style={styles.dangerButtonText}>
                            {savingAction === "history" ? t.saving : t.clear}
                        </Text>
                    </Pressable>
                </SettingRow>
            </SettingSection>

            <SettingSection colors={colors} marker="N" title={t.notifications}>
                <SettingRow
                    colors={colors}
                    label={t.enableNotifications}
                    description={t.notificationsDescription}
                >
                    <Switch
                        value={settings.notifications}
                        onValueChange={(value) => updateSetting("notifications", value)}
                        trackColor={{ false: "#CFD8E3", true: "#A5D6A7" }}
                        thumbColor={settings.notifications ? "#2E7D32" : "#FFFFFF"}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection colors={colors} marker="I" title={t.about}>
                <SettingRow colors={colors} label={t.version}>
                    <Text style={[styles.versionText, { color: colors.text }]}>1.0.0</Text>
                </SettingRow>

                <SettingRow colors={colors} label={t.privacyPolicy} description={t.privacyDescription}>
                    <Pressable
                        style={[styles.secondaryButton, { backgroundColor: colors.soft }]}
                        onPress={() => setPrivacyVisible(true)}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.open}</Text>
                    </Pressable>
                </SettingRow>
            </SettingSection>

            <Modal transparent visible={privacyVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalPanel, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t.privacyPolicy}</Text>
                        <Text style={[styles.modalText, { color: colors.muted }]}>{t.privacyText}</Text>
                        <Pressable
                            style={styles.primaryButton}
                            onPress={() => setPrivacyVisible(false)}
                        >
                            <Text style={styles.primaryButtonText}>{t.close}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 14,
    },
    heroCard: {
        borderRadius: 22,
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 6,
    },
    subtitle: {
        lineHeight: 20,
    },
    section: {
        borderRadius: 22,
        padding: 16,
        gap: 14,
    },
    sectionHeading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sectionIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionIconText: {
        color: "#2E7D32",
        fontWeight: "800",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    form: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        gap: 10,
    },
    inputLabel: {
        fontWeight: "700",
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
    },
    row: {
        borderTopWidth: 1,
        paddingTop: 14,
        gap: 12,
    },
    rowTextWrap: {
        gap: 4,
    },
    rowLabel: {
        fontWeight: "800",
    },
    rowDescription: {
        lineHeight: 19,
    },
    rowAction: {
        alignSelf: "stretch",
    },
    segmented: {
        flexDirection: "row",
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    segmentButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    segmentButtonText: {
        fontWeight: "800",
        fontSize: 13,
    },
    primaryButton: {
        backgroundColor: "#142033",
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "800",
    },
    secondaryButton: {
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    secondaryButtonText: {
        fontWeight: "800",
    },
    dangerButton: {
        backgroundColor: "#FFF1F1",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    dangerButtonText: {
        color: "#B42318",
        fontWeight: "800",
    },
    versionText: {
        fontWeight: "800",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(20, 32, 51, 0.42)",
        padding: 20,
        justifyContent: "center",
    },
    modalPanel: {
        borderRadius: 22,
        padding: 20,
        gap: 14,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    modalText: {
        lineHeight: 20,
    },
});

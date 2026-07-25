import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import {
    changePassword,
    clearMyHistory,
    updateProfile,
} from "../lib/api";
import { getStoredUser, getToken, updateStoredAuth } from "../lib/auth";
import {
    applyStoredTheme,
    readSettings,
    saveSettings,
} from "../lib/preferences";
import "../styles/settings-page.css";

const copy = {
    en: {
        page: "Settings",
        title: "User Settings",
        subtitle: "Manage account preferences, camera defaults, history, and app details.",
        saved: "Settings saved.",
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
        saving: "Saving...",
    },
    tr: {
        page: "Ayarlar",
        title: "Kullanici Ayarlari",
        subtitle: "Hesap tercihlerini, kamera varsayilanlarini, gecmisi ve uygulama bilgilerini yonet.",
        saved: "Ayarlar kaydedildi.",
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
        saving: "Kaydediliyor...",
    },
};

function SettingsRow({ label, description, action }) {
    return (
        <div className="settings-row">
            <div>
                <p className="settings-row__label">{label}</p>
                {description && <p className="settings-row__description">{description}</p>}
            </div>

            <div className="settings-row__action">{action}</div>
        </div>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <button
            aria-pressed={checked}
            aria-label={label}
            className={checked ? "settings-toggle settings-toggle--on" : "settings-toggle"}
            onClick={() => onChange(!checked)}
            type="button"
        >
            <span />
        </button>
    );
}

function getUserFromAuth(authResponse) {
    return {
        userId: authResponse.userId,
        username: authResponse.username,
        email: authResponse.email,
    };
}

export default function Settings() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const [settings, setSettings] = useState(readSettings);
    const [profile, setProfile] = useState({
        name: user?.username || user?.fullName || user?.name || "",
        email: user?.email || "",
    });
    const [password, setPassword] = useState({
        current: "",
        next: "",
        confirm: "",
    });
    const [message, setMessage] = useState("");
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [savingAction, setSavingAction] = useState("");

    const t = copy[settings.language] || copy.en;

    useEffect(() => {
        saveSettings(settings);
        applyStoredTheme();
    }, [settings]);

    const languageLabel = useMemo(
        () => (settings.language === "tr" ? t.turkish : t.english),
        [settings.language, t]
    );

    function updateSetting(key, value) {
        setSettings((current) => ({ ...current, [key]: value }));
        setMessage(t.saved);
    }

    async function saveProfile(event) {
        event.preventDefault();
        setSavingAction("profile");
        setMessage("");

        try {
            const token = getToken();
            const response = await updateProfile(
                {
                    username: profile.name.trim(),
                    email: profile.email.trim().toLowerCase(),
                },
                token
            );

            updateStoredAuth(response);
            const nextUser = getUserFromAuth(response);
            setProfile({
                name: nextUser.username || "",
                email: nextUser.email || "",
            });
            setMessage(t.profileSaved);
        } catch (err) {
            setMessage(err.message || "Profile update failed");
        } finally {
            setSavingAction("");
        }
    }

    async function savePassword(event) {
        event.preventDefault();

        if (!password.next || password.next.length < 6) {
            setMessage(t.passwordLength);
            return;
        }

        if (password.next !== password.confirm) {
            setMessage(t.passwordMismatch);
            return;
        }

        setSavingAction("password");
        setMessage("");

        try {
            await changePassword(
                {
                    currentPassword: password.current,
                    newPassword: password.next,
                },
                getToken()
            );
            setPassword({ current: "", next: "", confirm: "" });
            setMessage(t.passwordSaved);
        } catch (err) {
            setMessage(err.message || "Password change failed");
        } finally {
            setSavingAction("");
        }
    }

    async function clearHistory() {
        const confirmed = window.confirm(t.clearConfirm);

        if (!confirmed) return;

        setSavingAction("history");
        setMessage("");

        try {
            await clearMyHistory(getToken());
            setMessage(t.historyCleared);
        } catch (err) {
            setMessage(err.message || "Clear history failed");
        } finally {
            setSavingAction("");
        }
    }

    return (
        <MainLayout>
            <section className="settings-page">
                <div className="settings-page__header">
                    <div>
                        <p className="settings-page__eyebrow">{t.page}</p>
                        <h1 className="settings-page__title">{t.title}</h1>
                        <p className="settings-page__subtitle">{t.subtitle}</p>
                    </div>

                    {message && <div className="settings-status">{message}</div>}
                </div>

                <div className="settings-grid">
                    <article className="settings-section settings-section--wide">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">A</span>
                            <h2>{t.account}</h2>
                        </div>

                        <div className="settings-forms">
                            <form className="settings-form" onSubmit={saveProfile}>
                                <label>
                                    {t.displayName}
                                    <input
                                        value={profile.name}
                                        onChange={(event) =>
                                            setProfile((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder={t.displayName}
                                        type="text"
                                    />
                                </label>

                                <label>
                                    {t.email}
                                    <input
                                        value={profile.email}
                                        onChange={(event) =>
                                            setProfile((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        placeholder="you@example.com"
                                        type="email"
                                    />
                                </label>

                                <button
                                    className="settings-primary-btn"
                                    disabled={savingAction === "profile"}
                                    type="submit"
                                >
                                    {savingAction === "profile" ? t.saving : t.editProfile}
                                </button>
                            </form>

                            <form className="settings-form" onSubmit={savePassword}>
                                <label>
                                    {t.currentPassword}
                                    <input
                                        value={password.current}
                                        onChange={(event) =>
                                            setPassword((current) => ({
                                                ...current,
                                                current: event.target.value,
                                            }))
                                        }
                                        type="password"
                                    />
                                </label>

                                <label>
                                    {t.newPassword}
                                    <input
                                        value={password.next}
                                        onChange={(event) =>
                                            setPassword((current) => ({
                                                ...current,
                                                next: event.target.value,
                                            }))
                                        }
                                        type="password"
                                    />
                                </label>

                                <label>
                                    {t.confirmPassword}
                                    <input
                                        value={password.confirm}
                                        onChange={(event) =>
                                            setPassword((current) => ({
                                                ...current,
                                                confirm: event.target.value,
                                            }))
                                        }
                                        type="password"
                                    />
                                </label>

                                <button
                                    className="settings-primary-btn"
                                    disabled={savingAction === "password"}
                                    type="submit"
                                >
                                    {savingAction === "password" ? t.saving : t.changePassword}
                                </button>
                            </form>
                        </div>
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">T</span>
                            <h2>{t.appearance}</h2>
                        </div>

                        <SettingsRow
                            description={t.themeDescription}
                            label={t.theme}
                            action={
                                <select
                                    value={settings.theme}
                                    onChange={(event) => updateSetting("theme", event.target.value)}
                                >
                                    <option value="system">{t.system}</option>
                                    <option value="light">{t.light}</option>
                                    <option value="dark">{t.dark}</option>
                                </select>
                            }
                        />
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">L</span>
                            <h2>{t.language}</h2>
                        </div>

                        <SettingsRow
                            description={`${t.currentLanguage}: ${languageLabel}`}
                            label={t.languageChoice}
                            action={
                                <div className="settings-segmented" role="group">
                                    <button
                                        className={
                                            settings.language === "tr"
                                                ? "settings-segmented__btn settings-segmented__btn--active"
                                                : "settings-segmented__btn"
                                        }
                                        onClick={() => updateSetting("language", "tr")}
                                        type="button"
                                    >
                                        {t.turkish}
                                    </button>
                                    <button
                                        className={
                                            settings.language === "en"
                                                ? "settings-segmented__btn settings-segmented__btn--active"
                                                : "settings-segmented__btn"
                                        }
                                        onClick={() => updateSetting("language", "en")}
                                        type="button"
                                    >
                                        {t.english}
                                    </button>
                                </div>
                            }
                        />
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">C</span>
                            <h2>{t.camera}</h2>
                        </div>

                        <SettingsRow
                            description={t.autoScanDescription}
                            label={t.autoScan}
                            action={
                                <Toggle
                                    checked={settings.autoScan}
                                    label={t.autoScan}
                                    onChange={(value) => updateSetting("autoScan", value)}
                                />
                            }
                        />

                        <SettingsRow
                            description={t.flashDefaultDescription}
                            label={t.flashDefault}
                            action={
                                <Toggle
                                    checked={settings.flashDefault}
                                    label={t.flashDefault}
                                    onChange={(value) => updateSetting("flashDefault", value)}
                                />
                            }
                        />
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">H</span>
                            <h2>{t.history}</h2>
                        </div>

                        <SettingsRow
                            description={t.viewHistoryDescription}
                            label={t.viewHistory}
                            action={
                                <button
                                    className="settings-secondary-btn"
                                    onClick={() => navigate("/history")}
                                    type="button"
                                >
                                    {t.view}
                                </button>
                            }
                        />

                        <SettingsRow
                            description={t.clearHistoryDescription}
                            label={t.clearHistory}
                            action={
                                <button
                                    className="settings-danger-btn"
                                    disabled={savingAction === "history"}
                                    onClick={clearHistory}
                                    type="button"
                                >
                                    {savingAction === "history" ? t.saving : t.clear}
                                </button>
                            }
                        />
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">N</span>
                            <h2>{t.notifications}</h2>
                        </div>

                        <SettingsRow
                            description={t.notificationsDescription}
                            label={t.enableNotifications}
                            action={
                                <Toggle
                                    checked={settings.notifications}
                                    label={t.enableNotifications}
                                    onChange={(value) => updateSetting("notifications", value)}
                                />
                            }
                        />
                    </article>

                    <article className="settings-section">
                        <div className="settings-section__heading">
                            <span className="settings-section__icon">I</span>
                            <h2>{t.about}</h2>
                        </div>

                        <SettingsRow label={t.version} action={<strong>1.0.0</strong>} />
                        <SettingsRow
                            description={t.privacyDescription}
                            label={t.privacyPolicy}
                            action={
                                <button
                                    className="settings-secondary-btn"
                                    onClick={() => setShowPrivacy(true)}
                                    type="button"
                                >
                                    {t.open}
                                </button>
                            }
                        />
                    </article>
                </div>

                {showPrivacy && (
                    <div
                        aria-modal="true"
                        className="settings-modal"
                        role="dialog"
                    >
                        <div className="settings-modal__panel">
                            <h2>{t.privacyPolicy}</h2>
                            <p>{t.privacyText}</p>
                            <button
                                className="settings-primary-btn"
                                onClick={() => setShowPrivacy(false)}
                                type="button"
                            >
                                {t.close}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </MainLayout>
    );
}

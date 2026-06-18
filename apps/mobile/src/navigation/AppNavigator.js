import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import CameraScreen from "../screens/CameraScreen";
import LiveCameraScreen from "../screens/LiveCameraScreen";
import HistoryScreen from "../screens/HistoryScreen";
import MapScreen from "../screens/MapScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { clearAuth, getToken } from "../lib/authStorage";
import { defaultSettings, readSettings, resolveTheme } from "../lib/preferences";

const Stack = createNativeStackNavigator();

const copy = {
    en: {
        home: "Home",
        live: "Live",
        history: "History",
        map: "Map",
        settings: "Settings",
    },
    tr: {
        home: "Ana Sayfa",
        live: "Canli",
        history: "Gecmis",
        map: "Harita",
        settings: "Ayarlar",
    },
};

function MainHeader({ activeTab, language, onChangeTab, onLogout, theme }) {
    const labels = copy[language] || copy.en;
    const isDark = theme === "dark";

    return (
        <SafeAreaView edges={["top"]} style={[styles.safeHeader, isDark && styles.safeHeaderDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <View style={styles.headerTopRow}>
                    <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                        Smart Recycle Assistant
                    </Text>

                    <Pressable
                        onPress={onLogout}
                        style={[styles.logoutIconButton, isDark && styles.logoutIconButtonDark]}
                    >
                        <MaterialIcons name="logout" size={22} color={isDark ? "#F8FBFF" : "#142033"} />
                    </Pressable>
                </View>

                <View style={styles.tabRow}>
                    <Pressable
                        onPress={() => onChangeTab("home")}
                        style={[
                            styles.tabButton,
                            isDark && styles.tabButtonDark,
                            activeTab === "home" && styles.tabButtonActive,
                            isDark && activeTab === "home" && styles.tabButtonActiveDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                isDark && styles.tabButtonTextDark,
                                activeTab === "home" && styles.tabButtonTextActive,
                            ]}
                        >
                            {labels.home}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("live")}
                        style={[
                            styles.tabButton,
                            isDark && styles.tabButtonDark,
                            activeTab === "live" && styles.tabButtonActive,
                            isDark && activeTab === "live" && styles.tabButtonActiveDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                isDark && styles.tabButtonTextDark,
                                activeTab === "live" && styles.tabButtonTextActive,
                            ]}
                        >
                            {labels.live}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("history")}
                        style={[
                            styles.tabButton,
                            isDark && styles.tabButtonDark,
                            activeTab === "history" && styles.tabButtonActive,
                            isDark && activeTab === "history" && styles.tabButtonActiveDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                isDark && styles.tabButtonTextDark,
                                activeTab === "history" && styles.tabButtonTextActive,
                            ]}
                        >
                            {labels.history}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("map")}
                        style={[
                            styles.tabButton,
                            isDark && styles.tabButtonDark,
                            activeTab === "map" && styles.tabButtonActive,
                            isDark && activeTab === "map" && styles.tabButtonActiveDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                isDark && styles.tabButtonTextDark,
                                activeTab === "map" && styles.tabButtonTextActive,
                            ]}
                        >
                            {labels.map}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("settings")}
                        style={[
                            styles.tabButton,
                            isDark && styles.tabButtonDark,
                            activeTab === "settings" && styles.tabButtonActive,
                            isDark && activeTab === "settings" && styles.tabButtonActiveDark,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                isDark && styles.tabButtonTextDark,
                                activeTab === "settings" && styles.tabButtonTextActive,
                            ]}
                        >
                            {labels.settings}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

function MainScreen({ onLogout }) {
    const [activeTab, setActiveTab] = useState("home");
    const [settings, setSettings] = useState(defaultSettings);
    const theme = resolveTheme(settings.theme);

    useEffect(() => {
        readSettings()
            .then(setSettings)
            .catch(() => setSettings(defaultSettings));
    }, []);

    function renderActiveScreen() {
        if (activeTab === "home") {
            return <CameraScreen theme={theme} />;
        }

        if (activeTab === "history") {
            return <HistoryScreen theme={theme} />;
        }

        if (activeTab === "live") {
            return <LiveCameraScreen theme={theme} />;
        }

        if (activeTab === "map") {
            return <MapScreen theme={theme} />;
        }

        if (activeTab === "settings") {
            return (
                <SettingsScreen
                    onNavigate={setActiveTab}
                    onPreferencesChange={setSettings}
                />
            );
        }

        return <CameraScreen theme={theme} />;
    }

    return (
        <SafeAreaView
            style={[styles.mainSafeArea, theme === "dark" && styles.mainSafeAreaDark]}
            edges={["bottom"]}
        >
            <MainHeader
                activeTab={activeTab}
                language={settings.language}
                onChangeTab={setActiveTab}
                onLogout={onLogout}
                theme={theme}
            />

            <View style={styles.screenContainer}>
                {renderActiveScreen()}
            </View>
        </SafeAreaView>
    );
}

export default function AppNavigator() {
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    async function loadSession() {
        try {
            const savedToken = await getToken();
            setToken(savedToken);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSession();
    }, []);

    async function handleLogout() {
        await clearAuth();
        setToken(null);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {token ? (
                <MainScreen onLogout={handleLogout} />
            ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login">
                        {(props) => <LoginScreen {...props} onLoginSuccess={loadSession} />}
                    </Stack.Screen>

                    <Stack.Screen name="Signup">
                        {(props) => (
                            <SignupScreen {...props} onSignupSuccess={loadSession} />
                        )}
                    </Stack.Screen>
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FB",
    },
    mainSafeArea: {
        flex: 1,
        backgroundColor: "#F5F7FB",
    },
    mainSafeAreaDark: {
        backgroundColor: "#0F1722",
    },
    safeHeader: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#E3E8EF",
    },
    safeHeaderDark: {
        backgroundColor: "#142033",
        borderBottomColor: "#263244",
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: "#ffffff",
    },
    headerDark: {
        backgroundColor: "#142033",
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#142033",
    },
    headerTitleDark: {
        color: "#F8FBFF",
    },
    logoutIconButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#EEF2F7",
        alignItems: "center",
        justifyContent: "center",
    },
    logoutIconButtonDark: {
        backgroundColor: "#263244",
    },
    tabRow: {
        flexDirection: "row",
        gap: 8,
    },
    tabButton: {
        flex: 1,
        backgroundColor: "#EEF2F7",
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
    },
    tabButtonActive: {
        backgroundColor: "#E8F5E9",
    },
    tabButtonDark: {
        backgroundColor: "#263244",
    },
    tabButtonActiveDark: {
        backgroundColor: "#173A24",
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#516072",
    },
    tabButtonTextDark: {
        color: "#C7D0DE",
    },
    tabButtonTextActive: {
        color: "#2E7D32",
    },
    screenContainer: {
        flex: 1,
    },
});

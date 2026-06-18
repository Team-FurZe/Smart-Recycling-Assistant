import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
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
import { clearAuth, getToken, getUser } from "../lib/authStorage";
import { defaultSettings, readSettings, resolveTheme } from "../lib/preferences";

const Stack = createNativeStackNavigator();

const copy = {
    en: {
        home: "Home",
        live: "Live",
        history: "History",
        map: "Map",
        settings: "Settings",
        menu: "Menu",
        logout: "Logout",
        appName: "Smart Recycle Assistant",
        signedInAs: "Signed in as",
    },
    tr: {
        home: "Ana Sayfa",
        live: "Canli",
        history: "Gecmis",
        map: "Harita",
        settings: "Ayarlar",
        menu: "Menu",
        logout: "Cikis",
        appName: "Smart Recycle Assistant",
        signedInAs: "Giris yapan",
    },
};

const drawerItems = [
    { key: "home", icon: "photo-camera" },
    { key: "live", icon: "videocam" },
    { key: "history", icon: "history" },
    { key: "map", icon: "map" },
    { key: "settings", icon: "settings" },
];

function MainHeader({ activeTab, language, onOpenMenu, theme }) {
    const labels = copy[language] || copy.en;
    const isDark = theme === "dark";

    return (
        <SafeAreaView edges={["top"]} style={[styles.safeHeader, isDark && styles.safeHeaderDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <View style={styles.headerTopRow}>
                    <Pressable
                        onPress={onOpenMenu}
                        style={[styles.menuIconButton, isDark && styles.menuIconButtonDark]}
                        accessibilityLabel={labels.menu}
                    >
                        <MaterialIcons name="menu" size={24} color={isDark ? "#F8FBFF" : "#17221B"} />
                    </Pressable>

                    <View style={styles.headerTitleWrap}>
                        <Text style={[styles.headerEyebrow, isDark && styles.headerEyebrowDark]}>
                            {labels.appName}
                        </Text>
                        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                            {labels[activeTab]}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

function DrawerMenu({
    activeTab,
    language,
    onChangeTab,
    onClose,
    onLogout,
    open,
    progress,
    theme,
    user,
}) {
    const labels = copy[language] || copy.en;
    const isDark = theme === "dark";
    const width = Math.min(310, Dimensions.get("window").width * 0.84);
    const displayName =
        user?.username || user?.fullName || user?.name || user?.email || "User";
    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, 0],
    });

    if (!open) return null;

    return (
        <View style={styles.drawerLayer} pointerEvents="box-none">
            <Pressable
                style={styles.drawerBackdrop}
                onPress={onClose}
                accessibilityLabel="Close menu"
            />

            <Animated.View
                style={[
                    styles.drawerPanel,
                    { width, transform: [{ translateX }] },
                    isDark && styles.drawerPanelDark,
                ]}
            >
                <SafeAreaView edges={["top", "bottom"]} style={styles.drawerSafe}>
                    <View style={styles.drawerBrand}>
                        <View style={[styles.drawerLogo, isDark && styles.drawerLogoDark]}>
                            <Text style={[styles.drawerLogoText, isDark && styles.drawerLogoTextDark]}>S</Text>
                        </View>
                        <View style={styles.drawerBrandText}>
                            <Text style={[styles.drawerTitle, isDark && styles.drawerTitleDark]}>
                                Smart Recycle
                            </Text>
                            <Text style={[styles.drawerSubtitle, isDark && styles.drawerSubtitleDark]}>
                                Assistant
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.drawerUserCard, isDark && styles.drawerUserCardDark]}>
                        <Text style={[styles.drawerUserLabel, isDark && styles.drawerUserLabelDark]}>
                            {labels.signedInAs}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={[styles.drawerUserName, isDark && styles.drawerUserNameDark]}
                        >
                            {displayName}
                        </Text>
                    </View>

                    <View style={styles.drawerNav}>
                        {drawerItems.map((item) => {
                            const active = activeTab === item.key;

                            return (
                                <Pressable
                                    key={item.key}
                                    onPress={() => {
                                        onChangeTab(item.key);
                                        onClose();
                                    }}
                                    style={[
                                        styles.drawerItem,
                                        isDark && styles.drawerItemDark,
                                        active && styles.drawerItemActive,
                                        isDark && active && styles.drawerItemActiveDark,
                                    ]}
                                >
                                    <MaterialIcons
                                        name={item.icon}
                                        size={22}
                                        color={active ? "#236B45" : isDark ? "#BAC8BD" : "#5F6F64"}
                                    />
                                    <Text
                                        style={[
                                            styles.drawerItemText,
                                            isDark && styles.drawerItemTextDark,
                                            active && styles.drawerItemTextActive,
                                        ]}
                                    >
                                        {labels[item.key]}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Pressable
                        onPress={onLogout}
                        style={[styles.drawerLogout, isDark && styles.drawerLogoutDark]}
                    >
                        <MaterialIcons name="logout" size={21} color={isDark ? "#EDF4EE" : "#17221B"} />
                        <Text style={[styles.drawerLogoutText, isDark && styles.drawerLogoutTextDark]}>
                            {labels.logout}
                        </Text>
                    </Pressable>
                </SafeAreaView>
            </Animated.View>
        </View>
    );
}

function MainScreen({ onLogout }) {
    const [activeTab, setActiveTab] = useState("home");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [settings, setSettings] = useState(defaultSettings);
    const [user, setUser] = useState(null);
    const drawerProgress = React.useRef(new Animated.Value(0)).current;
    const theme = resolveTheme(settings.theme);

    useEffect(() => {
        readSettings()
            .then(setSettings)
            .catch(() => setSettings(defaultSettings));
        getUser()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

    function openDrawer() {
        setDrawerOpen(true);
        Animated.timing(drawerProgress, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }

    function closeDrawer() {
        Animated.timing(drawerProgress, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setDrawerOpen(false);
            }
        });
    }

    function renderActiveScreen() {
        if (activeTab === "home") {
            return <CameraScreen theme={theme} onAuthExpired={onLogout} />;
        }

        if (activeTab === "history") {
            return <HistoryScreen theme={theme} />;
        }

        if (activeTab === "live") {
            return <LiveCameraScreen theme={theme} onAuthExpired={onLogout} />;
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

        return <CameraScreen theme={theme} onAuthExpired={onLogout} />;
    }

    return (
        <SafeAreaView
            style={[styles.mainSafeArea, theme === "dark" && styles.mainSafeAreaDark]}
            edges={["bottom"]}
        >
            <MainHeader
                activeTab={activeTab}
                language={settings.language}
                onOpenMenu={openDrawer}
                theme={theme}
            />

            <View style={styles.screenContainer}>
                {renderActiveScreen()}
            </View>

            <DrawerMenu
                activeTab={activeTab}
                language={settings.language}
                onChangeTab={setActiveTab}
                onClose={closeDrawer}
                onLogout={onLogout}
                open={drawerOpen}
                progress={drawerProgress}
                theme={theme}
                user={user}
            />
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
        backgroundColor: "#F7F8F6",
    },
    mainSafeAreaDark: {
        backgroundColor: "#101813",
    },
    safeHeader: {
        backgroundColor: "#ffffff",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E1E6DE",
    },
    safeHeaderDark: {
        backgroundColor: "#172119",
        borderBottomColor: "#2D3B30",
    },
    header: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: "#ffffff",
    },
    headerDark: {
        backgroundColor: "#172119",
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerEyebrow: {
        color: "#7C8B81",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    headerEyebrowDark: {
        color: "#94A398",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#17221B",
    },
    headerTitleDark: {
        color: "#EDF4EE",
    },
    menuIconButton: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#F2F5F1",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    menuIconButtonDark: {
        backgroundColor: "#1E2A21",
        borderColor: "#2D3B30",
    },
    drawerLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },
    drawerBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(16, 24, 19, 0.42)",
    },
    drawerPanel: {
        height: "100%",
        backgroundColor: "#FFFFFF",
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        shadowColor: "#000000",
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 6, height: 0 },
        elevation: 10,
    },
    drawerPanelDark: {
        backgroundColor: "#172119",
    },
    drawerSafe: {
        flex: 1,
        padding: 18,
    },
    drawerBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E1E6DE",
    },
    drawerLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#E8F3EC",
        alignItems: "center",
        justifyContent: "center",
    },
    drawerLogoDark: {
        backgroundColor: "#1F3827",
    },
    drawerLogoText: {
        color: "#174A31",
        fontSize: 19,
        fontWeight: "900",
    },
    drawerLogoTextDark: {
        color: "#9CE6B1",
    },
    drawerBrandText: {
        flex: 1,
    },
    drawerTitle: {
        color: "#17221B",
        fontSize: 18,
        fontWeight: "800",
    },
    drawerTitleDark: {
        color: "#EDF4EE",
    },
    drawerSubtitle: {
        color: "#5F6F64",
        fontWeight: "700",
    },
    drawerSubtitleDark: {
        color: "#BAC8BD",
    },
    drawerUserCard: {
        marginTop: 14,
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#F2F5F1",
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    drawerUserCardDark: {
        backgroundColor: "#1E2A21",
        borderColor: "#2D3B30",
    },
    drawerUserLabel: {
        color: "#7C8B81",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    drawerUserLabelDark: {
        color: "#94A398",
    },
    drawerUserName: {
        color: "#17221B",
        fontSize: 15,
        fontWeight: "800",
    },
    drawerUserNameDark: {
        color: "#EDF4EE",
    },
    drawerNav: {
        gap: 8,
        paddingTop: 18,
    },
    drawerItem: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: "transparent",
    },
    drawerItemDark: {
        backgroundColor: "transparent",
    },
    drawerItemActive: {
        backgroundColor: "#E8F3EC",
    },
    drawerItemActiveDark: {
        backgroundColor: "#1F3827",
    },
    drawerItemText: {
        color: "#17221B",
        fontSize: 15,
        fontWeight: "800",
    },
    drawerItemTextDark: {
        color: "#EDF4EE",
    },
    drawerItemTextActive: {
        color: "#236B45",
    },
    drawerLogout: {
        minHeight: 48,
        marginTop: "auto",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#CBD6C8",
    },
    drawerLogoutDark: {
        borderColor: "#415144",
    },
    drawerLogoutText: {
        color: "#17221B",
        fontWeight: "800",
    },
    drawerLogoutTextDark: {
        color: "#EDF4EE",
    },
    screenContainer: {
        flex: 1,
    },
});

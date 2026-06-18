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
import { clearAuth, getToken } from "../lib/authStorage";

const Stack = createNativeStackNavigator();

function MainHeader({ activeTab, onChangeTab, onLogout }) {
    return (
        <SafeAreaView edges={["top"]} style={styles.safeHeader}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <Text style={styles.headerTitle}>Smart Recycle Assistant</Text>

                    <Pressable onPress={onLogout} style={styles.logoutIconButton}>
                        <MaterialIcons name="logout" size={22} color="#142033" />
                    </Pressable>
                </View>

                <View style={styles.tabRow}>
                    <Pressable
                        onPress={() => onChangeTab("home")}
                        style={[
                            styles.tabButton,
                            activeTab === "home" && styles.tabButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "home" && styles.tabButtonTextActive,
                            ]}
                        >
                            Home
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("live")}
                        style={[
                            styles.tabButton,
                            activeTab === "live" && styles.tabButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "live" && styles.tabButtonTextActive,
                            ]}
                        >
                            Live
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("history")}
                        style={[
                            styles.tabButton,
                            activeTab === "history" && styles.tabButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "history" && styles.tabButtonTextActive,
                            ]}
                        >
                            History
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChangeTab("map")}
                        style={[
                            styles.tabButton,
                            activeTab === "map" && styles.tabButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === "map" && styles.tabButtonTextActive,
                            ]}
                        >
                            Map
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

function MainScreen({ onLogout }) {
    const [activeTab, setActiveTab] = useState("home");

    function renderActiveScreen() {
        if (activeTab === "home") {
            return <CameraScreen />;
        }

        if (activeTab === "history") {
            return <HistoryScreen />;
        }

        if (activeTab === "live") {
            return <LiveCameraScreen />;
        }

        if (activeTab === "map") {
            return <MapScreen />;
        }

        return <CameraScreen />;
    }

    return (
        <SafeAreaView style={styles.mainSafeArea} edges={["bottom"]}>
            <MainHeader
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                onLogout={onLogout}
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
    safeHeader: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#E3E8EF",
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: "#ffffff",
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
    logoutIconButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#EEF2F7",
        alignItems: "center",
        justifyContent: "center",
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
    tabButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#516072",
    },
    tabButtonTextActive: {
        color: "#2E7D32",
    },
    screenContainer: {
        flex: 1,
    },
});

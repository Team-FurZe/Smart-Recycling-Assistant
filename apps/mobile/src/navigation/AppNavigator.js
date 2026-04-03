import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import CameraScreen from "../screens/CameraScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { getToken } from "../lib/authStorage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Detect">
                {() => <CameraScreen />}
            </Tab.Screen>
            <Tab.Screen name="History">
                {() => <HistoryScreen />}
            </Tab.Screen>
            <Tab.Screen name="Profile">
                {() => <ProfileScreen onLogout={onLogout} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadAuth() {
        try {
            const savedToken = await getToken();
            setToken(savedToken);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAuth();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {token ? (
                <MainTabs
                    onLogout={() => {
                        setToken(null);
                    }}
                />
            ) : (
                <Stack.Navigator>
                    <Stack.Screen name="Login" options={{ headerShown: false }}>
                        {() => <LoginScreen onLoginSuccess={() => loadAuth()} />}
                    </Stack.Screen>
                    <Stack.Screen name="Signup" options={{ headerShown: false }}>
                        {() => <SignupScreen onSignupSuccess={() => loadAuth()} />}
                    </Stack.Screen>
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}
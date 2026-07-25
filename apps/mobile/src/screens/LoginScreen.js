import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { loginUser } from "../lib/api";
import { saveAuthResponse } from "../lib/authStorage";

export default function LoginScreen({ onLoginSuccess }) {
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill all fields.");
            return;
        }

        try {
            setLoading(true);

            const data = await loginUser({
                email: email.trim(),
                password,
            });

            await saveAuthResponse(data);
            onLoginSuccess?.();
        } catch (e) {
            Alert.alert("Login failed", e.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.page}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <View style={styles.brandRow}>
                    <View style={styles.iconBox}>
                        <Text style={styles.iconText}>S</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eyebrow}>Smart Recycle Assistant</Text>
                        <Text style={styles.title}>Login</Text>
                        <Text style={styles.subtitle}>Sign in to continue.</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.primaryButtonText}>
                        {loading ? "Logging in..." : "Login"}
                    </Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate("Signup")}>
                    <Text style={styles.link}>Do not have an account? Sign up</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#F7F8F6",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E1E6DE",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    brandRow: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 22,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: "#E8F3EC",
        alignItems: "center",
        justifyContent: "center",
    },
    iconText: {
        color: "#174A31",
        fontSize: 22,
        fontWeight: "900",
    },
    eyebrow: {
        color: "#236B45",
        fontWeight: "800",
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#17221B",
    },
    subtitle: {
        color: "#5F6F64",
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD6C8",
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    primaryButton: {
        marginTop: 4,
        backgroundColor: "#236B45",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    link: {
        textAlign: "center",
        marginTop: 18,
        color: "#174A31",
        fontWeight: "600",
    },
});

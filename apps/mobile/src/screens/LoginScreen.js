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
import { loginUser } from "../lib/api";
import { saveAuth } from "../lib/authStorage";
import { useNavigation } from "@react-navigation/native";

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

            const token = data.token || data.accessToken || data.jwt;
            const user = data.user || { email: email.trim() };

            if (!token) {
                throw new Error("Token not found in login response.");
            }

            await saveAuth(token, user);
            onLoginSuccess?.();
        } catch (e) {
            Alert.alert("Login failed", e.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Smart Recycle Assistant</Text>
                <Text style={styles.subtitle}>Login</Text>

                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                />

                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />

                <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? "Loading..." : "Login"}</Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate("Signup")}>
                    <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#F5F7FB",
    },
    card: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D9DDE7",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    button: {
        backgroundColor: "#2E7D32",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 4,
    },
    buttonText: {
        color: "white",
        fontWeight: "700",
    },
    link: {
        textAlign: "center",
        marginTop: 16,
        color: "#1565C0",
    },
});
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
import { signupUser } from "../lib/api";
import { saveAuthResponse } from "../lib/authStorage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({ onSignupSuccess }) {
    const navigation = useNavigation();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup() {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedUsername || !trimmedEmail || !password.trim()) {
            Alert.alert("Error", "Please fill all fields.");
            return;
        }

        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            Alert.alert("Invalid email", "Please enter a valid email address, for example name@example.com.");
            return;
        }

        try {
            setLoading(true);

            const signupData = await signupUser({
                username: trimmedUsername,
                email: trimmedEmail,
                password,
            });

            await saveAuthResponse(signupData);
            onSignupSuccess?.();
        } catch (e) {
            Alert.alert("Signup failed", e.message || "Unknown error");
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
                        <Text style={styles.iconText}>♻</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eyebrow}>Smart Recycle Assistant</Text>
                        <Text style={styles.title}>Sign Up</Text>
                        <Text style={styles.subtitle}>Create your account.</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />

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

                <Pressable style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
                    <Text style={styles.primaryButtonText}>
                        {loading ? "Creating..." : "Create Account"}
                    </Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.link}>Already have an account? Login</Text>
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
        backgroundColor: "#F5F7FB",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
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
        borderRadius: 16,
        backgroundColor: "#2E7D32",
        alignItems: "center",
        justifyContent: "center",
    },
    iconText: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "700",
    },
    eyebrow: {
        color: "#2E7D32",
        fontWeight: "700",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#142033",
    },
    subtitle: {
        color: "#607080",
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D9E1EA",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    primaryButton: {
        marginTop: 4,
        backgroundColor: "#142033",
        padding: 15,
        borderRadius: 14,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    link: {
        textAlign: "center",
        marginTop: 18,
        color: "#1565C0",
        fontWeight: "600",
    },
});

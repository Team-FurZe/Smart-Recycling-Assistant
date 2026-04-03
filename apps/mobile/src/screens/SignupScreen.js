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
import { signupUser, loginUser } from "../lib/api";
import { saveAuth } from "../lib/authStorage";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen({ onSignupSuccess }) {
    const navigation = useNavigation();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup() {
        if (!fullName.trim() || !username.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill all fields.");
            return;
        }

        try {
            setLoading(true);

            await signupUser({
                fullName: fullName.trim(),
                username: username.trim(),
                password,
            });

            const loginData = await loginUser({
                username: username.trim(),
                password,
            });

            const token = loginData.token || loginData.accessToken || loginData.jwt;
            const user = loginData.user || {
                fullName: fullName.trim(),
                username: username.trim(),
            };

            if (!token) {
                throw new Error("Token not found after signup.");
            }

            await saveAuth(token, user);
            onSignupSuccess?.();
        } catch (e) {
            Alert.alert("Signup failed", e.message || "Unknown error");
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
                <Text style={styles.title}>Create Account</Text>

                <TextInput
                    placeholder="Full name"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                />

                <TextInput
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    style={styles.input}
                />

                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />

                <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? "Loading..." : "Sign up"}</Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.link}>Already have an account? Login</Text>
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
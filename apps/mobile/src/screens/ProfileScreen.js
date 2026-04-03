import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { clearAuth, getUser } from "../lib/authStorage";

export default function ProfileScreen({ onLogout }) {
    async function handleLogout() {
        try {
            await clearAuth();
            onLogout?.();
        } catch (e) {
            Alert.alert("Error", "Logout failed.");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <Pressable style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#C62828",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "700",
    },
});
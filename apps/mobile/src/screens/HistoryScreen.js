import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyHistory } from "../lib/api";
import { getToken } from "../lib/authStorage";

function renderDetectionSummary(item) {
    if (Array.isArray(item.detections) && item.detections.length > 0) {
        return item.detections.map((d) => d.label).join(", ");
    }

    if (item.label) {
        return item.label;
    }

    return "No detection info";
}

export default function HistoryScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function loadHistory(isRefresh = false) {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token = await getToken();
            const data = await getMyHistory(token);

            const list = Array.isArray(data)
                ? data
                : data.items || data.content || data.history || [];

            setItems(list);
        } catch (e) {
            console.error("History load error:", e.message);
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <FlatList
            contentContainerStyle={styles.container}
            data={items}
            keyExtractor={(item, index) => String(item.id || item.createdAt || index)}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />
            }
            ListEmptyComponent={<Text style={styles.empty}>No history found.</Text>}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.title}>{renderDetectionSummary(item)}</Text>
                    <Text style={styles.meta}>
                        {item.createdAt || item.created_at || "Date not available"}
                    </Text>
                    {!!item.noWaste && <Text style={styles.noWaste}>NO_WASTE</Text>}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    empty: {
        textAlign: "center",
        marginTop: 40,
        color: "#666",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E3E8EF",
    },
    title: {
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 6,
    },
    meta: {
        color: "#666",
        fontSize: 12,
    },
    noWaste: {
        marginTop: 8,
        color: "#2E7D32",
        fontWeight: "700",
    },
});
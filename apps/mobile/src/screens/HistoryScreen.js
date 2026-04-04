import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    TextInput,
    Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyHistory } from "../lib/api";
import { getToken } from "../lib/authStorage";
import HistoryImageOverlay from "../components/HistoryImageOverlay";

const BACKEND_URL =
    process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.0.2.2:8080";

function parsePrediction(predictionJson) {
    if (!predictionJson) return null;

    try {
        return JSON.parse(predictionJson);
    } catch {
        return null;
    }
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function buildImageUrl(storedImagePath) {
    if (!storedImagePath) return null;

    if (storedImagePath.startsWith("http://") || storedImagePath.startsWith("https://")) {
        return storedImagePath;
    }

    const normalized = storedImagePath.startsWith("/") ? storedImagePath : `/${storedImagePath}`;
    return `${BACKEND_URL}${normalized}`;
}

export default function HistoryScreen() {
    const [items, setItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    async function loadHistory(isRefresh = false) {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token = await getToken();
            const data = await getMyHistory(token);

            const list = Array.isArray(data) ? data : [];

            const mapped = list.map((item) => ({
                ...item,
                imageUrl: buildImageUrl(item.storedImagePath),
            }));

            setItems(mapped);
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

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return items;

        return items.filter((item) => {
            const parsed = parsePrediction(item.predictionJson);
            const labels = parsed?.detections?.map((d) => d.label).join(" ").toLowerCase() || "";

            return (
                (item.originalFileName || "").toLowerCase().includes(q) ||
                labels.includes(q)
            );
        });
    }, [items, search]);

    function renderSummary(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) return "Prediction data could not be parsed.";
        if (parsed.noWaste) return "No detectable waste found.";
        if (Array.isArray(parsed.detections) && parsed.detections.length > 0) {
            return `${parsed.detections.length} detection(s) found`;
        }

        return "Prediction available";
    }

    function renderBadges(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed || !Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return <Text style={styles.emptyBadge}>No labels</Text>;
        }

        return (
            <View style={styles.badgesRow}>
                {parsed.detections.map((item, index) => (
                    <View key={`${item.label}-${index}`} style={styles.badge}>
                        <Text style={styles.badgeText}>{item.label}</Text>
                    </View>
                ))}
            </View>
        );
    }

    function renderDetails(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) {
            return <Text style={styles.detailText}>Prediction data could not be parsed.</Text>;
        }

        if (parsed.noWaste) {
            return <Text style={styles.detailText}>No detectable waste found in this image.</Text>;
        }

        if (!Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return <Text style={styles.detailText}>No detection details available.</Text>;
        }

        return (
            <View style={styles.detailsBox}>
                {parsed.detections.map((item, index) => (
                    <View key={`${item.label}-${index}`} style={styles.detailCard}>
                        <Text style={styles.detailTitle}>{item.label}</Text>
                        <Text style={styles.detailText}>
                            Confidence: {((item.confidence || 0) * 100).toFixed(2)}%
                        </Text>
                        <Text style={styles.detailText}>Bin Color: {item.binColor || "-"}</Text>
                        {item.bbox ? (
                            <Text style={styles.detailText}>
                                Box: x {Number(item.bbox.x).toFixed(1)}, y {Number(item.bbox.y).toFixed(1)}, w{" "}
                                {Number(item.bbox.width).toFixed(1)}, h {Number(item.bbox.height).toFixed(1)}
                            </Text>
                        ) : null}
                    </View>
                ))}
            </View>
        );
    }

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
            data={filteredItems}
            keyExtractor={(item, index) => String(item.id || index)}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />
            }
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Prediction History</Text>
                    <Text style={styles.pageSubtitle}>See your previous detection results.</Text>

                    <TextInput
                        placeholder="Search by file or label"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                    />
                </View>
            }
            ListEmptyComponent={<Text style={styles.empty}>No history found yet.</Text>}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    {item.imageUrl ? (
                        <HistoryImageOverlay
                            imageUrl={item.imageUrl}
                            predictionJson={item.predictionJson}
                        />
                    ) : (
                        <View style={styles.noImageBox}>
                            <Text style={styles.noImageText}>No image</Text>
                        </View>
                    )}

                    <View style={styles.infoArea}>
                        <Text style={styles.fileName}>File: {item.originalFileName || "-"}</Text>
                        <Text style={styles.dateText}>Date: {formatDate(item.createdAt)}</Text>
                        <Text style={styles.summaryText}>
                            Summary: {renderSummary(item.predictionJson)}
                        </Text>

                        {renderBadges(item.predictionJson)}

                        <Pressable
                            style={styles.detailButton}
                            onPress={() =>
                                setExpandedId((prev) => (prev === item.id ? null : item.id))
                            }
                        >
                            <Text style={styles.detailButtonText}>
                                {expandedId === item.id ? "Hide Details" : "View Details"}
                            </Text>
                        </Pressable>

                        {expandedId === item.id ? renderDetails(item.predictionJson) : null}
                    </View>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: "#F8FAFC",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        marginBottom: 16,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    empty: {
        textAlign: "center",
        marginTop: 40,
        color: "#64748B",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    infoArea: {
        marginTop: 12,
    },
    fileName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: "#334155",
        marginBottom: 10,
    },
    badgesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    badge: {
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    badgeText: {
        color: "#166534",
        fontWeight: "700",
        fontSize: 12,
    },
    emptyBadge: {
        color: "#94A3B8",
        marginBottom: 12,
    },
    detailButton: {
        backgroundColor: "#0F172A",
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
    },
    detailButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    detailsBox: {
        marginTop: 12,
        gap: 10,
    },
    detailCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    detailTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
    },
    detailText: {
        fontSize: 13,
        color: "#475569",
        marginBottom: 4,
    },
    noImageBox: {
        height: 220,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E2E8F0",
    },
    noImageText: {
        color: "#64748B",
        fontWeight: "700",
    },
});
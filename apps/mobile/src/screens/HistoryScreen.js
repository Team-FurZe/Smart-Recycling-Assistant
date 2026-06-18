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
import { BACKEND_URL, getMyHistory } from "../lib/api";
import { getToken } from "../lib/authStorage";
import HistoryImageOverlay from "../components/HistoryImageOverlay";

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

    const normalized = storedImagePath.startsWith("/")
        ? storedImagePath
        : `/${storedImagePath}`;

    return `${BACKEND_URL}${normalized}`;
}

function getColors(theme) {
    const dark = theme === "dark";
    return {
        page: dark ? "#0F1722" : "#F5F7FB",
        card: dark ? "#172235" : "#FFFFFF",
        nested: dark ? "#121C2D" : "#F8FBFF",
        border: dark ? "#2A3850" : "#D9E1EA",
        image: dark ? "#0F1722" : "#E8EDF4",
        text: dark ? "#F8FBFF" : "#142033",
        muted: dark ? "#B9C4D3" : "#607080",
        subtle: dark ? "#91A0B5" : "#718096",
    };
}

export default function HistoryScreen({ theme = "light" }) {
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
                imageUrl: buildImageUrl(item.storedImagePath || item.imagePath || item.imageUrl),
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
            const labels =
                parsed?.detections?.map((d) => d.label).join(" ").toLowerCase() || "";

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

    const colors = getColors(theme);

    function renderDetails(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) {
            return <Text style={[styles.detailText, { color: colors.muted }]}>Prediction data could not be parsed.</Text>;
        }

        if (parsed.noWaste) {
            return <Text style={[styles.detailText, { color: colors.muted }]}>No detectable waste found in this image.</Text>;
        }

        if (!Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return <Text style={[styles.detailText, { color: colors.muted }]}>No detection details available.</Text>;
        }

        return (
            <View style={styles.detailList}>
                {parsed.detections.map((item, index) => (
                    <View key={item.id || `${item.label}-${index}`} style={[styles.detailCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.detailTitle, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.detailText, { color: colors.muted }]}>
                            Confidence: {((item.confidence || 0) * 100).toFixed(2)}%
                        </Text>
                        <Text style={[styles.detailText, { color: colors.muted }]}>Bin Color: {item.binColor || "-"}</Text>
                    </View>
                ))}
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.page }]}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    return (
        <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={[styles.container, { backgroundColor: colors.page }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />
            }
            ListHeaderComponent={
                <View style={styles.headerWrap}>
                    <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Prediction History</Text>
                        <Text style={[styles.subtitle, { color: colors.muted }]}>
                            Review previous uploads, labels, and bounding boxes.
                        </Text>
                    </View>

                    <TextInput
                        placeholderTextColor={colors.subtle}
                        style={[
                            styles.searchInput,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Search by file name or label..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            }
            ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No history found yet.</Text>}
            renderItem={({ item }) => (
                <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
                    {item.imageUrl ? (
                        <HistoryImageOverlay
                            imageUrl={item.imageUrl}
                            predictionJson={item.predictionJson}
                        />
                    ) : (
                        <View style={[styles.noImageBox, { backgroundColor: colors.image }]}>
                            <Text style={[styles.noImageText, { color: colors.muted }]}>No image</Text>
                        </View>
                    )}

                    <Text style={[styles.fileName, { color: colors.text }]}>{item.originalFileName || "Untitled file"}</Text>
                    <Text style={[styles.dateText, { color: colors.subtle }]}>{formatDate(item.createdAt)}</Text>
                    <Text style={[styles.summary, { color: colors.muted }]}>{renderSummary(item.predictionJson)}</Text>

                    <Pressable
                        style={styles.detailButton}
                        onPress={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                    >
                        <Text style={styles.detailButtonText}>
                            {expandedId === item.id ? "Hide Details" : "View Details"}
                        </Text>
                    </Pressable>

                    {expandedId === item.id && (
                        <View style={[styles.detailsWrap, { backgroundColor: colors.nested }]}>{renderDetails(item.predictionJson)}</View>
                    )}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#F5F7FB",
        gap: 14,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FB",
    },
    headerWrap: {
        gap: 14,
        marginBottom: 8,
    },
    heroCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#142033",
        marginBottom: 6,
    },
    subtitle: {
        color: "#607080",
        lineHeight: 20,
    },
    searchInput: {
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#D9E1EA",
        padding: 14,
    },
    empty: {
        textAlign: "center",
        color: "#607080",
        marginTop: 30,
    },
    historyCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 14,
        gap: 10,
    },
    noImageBox: {
        height: 220,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E8EDF4",
    },
    noImageText: {
        color: "#607080",
        fontWeight: "600",
    },
    fileName: {
        fontSize: 17,
        fontWeight: "700",
        color: "#142033",
    },
    dateText: {
        color: "#718096",
    },
    summary: {
        color: "#607080",
    },
    detailButton: {
        backgroundColor: "#142033",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    detailButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    detailsWrap: {
        backgroundColor: "#F8FBFF",
        borderRadius: 16,
        padding: 12,
    },
    detailList: {
        gap: 10,
    },
    detailCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 12,
    },
    detailTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#142033",
        marginBottom: 6,
    },
    detailText: {
        color: "#607080",
        marginBottom: 4,
    },
});

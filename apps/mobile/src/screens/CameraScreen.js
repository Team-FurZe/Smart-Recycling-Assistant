import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { predictImageFromUri } from "../lib/api";
import { getToken } from "../lib/authStorage";
import { getClassTip } from "../lib/recyclingTips";

const STILL_IMAGE_WIDTH = 1024;
const MIN_CONFIDENCE = 0.5;

const BIN_COLORS = {
    BIODEGRADABLE: "#8BC34A",
    CARDBOARD: "#A1887F",
    GLASS: "#4CAF50",
    METAL: "#9E9E9E",
    PAPER: "#2196F3",
    PLASTIC: "#FFC107",
};

function getBinColor(label, fallback) {
    return BIN_COLORS[label] || fallback || "#4CAF50";
}

function filterDetections(result) {
    return (result?.detections || []).filter(
        (det) => (det.confidence || 0) >= MIN_CONFIDENCE
    );
}

function getColors(theme) {
    const dark = theme === "dark";
    return {
        page: dark ? "#101813" : "#F7F8F6",
        card: dark ? "#172119" : "#FFFFFF",
        nested: dark ? "#1E2A21" : "#F2F5F1",
        border: dark ? "#2D3B30" : "#E1E6DE",
        soft: dark ? "#1E2A21" : "#F2F5F1",
        image: dark ? "#101813" : "#EEF2EA",
        text: dark ? "#EDF4EE" : "#17221B",
        muted: dark ? "#BAC8BD" : "#5F6F64",
    };
}

function DetectionBoxes({ detections, imageWidth, imageHeight, layout }) {
    const scale = useMemo(() => {
        return {
            sx: layout.w / (imageWidth || 1),
            sy: layout.h / (imageHeight || 1),
        };
    }, [layout, imageWidth, imageHeight]);

    return detections.map((det, index) => {
        if (!det.bbox) return null;

        const { x, y, width, height } = det.bbox;
        const color = getBinColor(det.label, det.binColor);

        return (
            <View
                key={det.id || `${det.label}-${index}`}
                style={[
                    styles.box,
                    {
                        left: x * scale.sx,
                        top: y * scale.sy,
                        width: width * scale.sx,
                        height: height * scale.sy,
                        borderColor: color,
                    },
                ]}
            >
                <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>
                        {det.label} {Math.round((det.confidence || 0) * 100)}%
                    </Text>
                </View>
            </View>
        );
    });
}

export default function CameraScreen({ theme = "light" }) {
    const [sourceUri, setSourceUri] = useState(null);
    const [predictUri, setPredictUri] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState({ w: 1, h: 1 });
    const [activeTipId, setActiveTipId] = useState(null);

    const optimizeImage = useCallback(async (uri) => {
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: STILL_IMAGE_WIDTH } }],
                { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulated.uri;
        } catch {
            return uri;
        }
    }, []);

    async function pickFromGallery() {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (perm.status !== "granted") {
            return Alert.alert("Permission", "Please allow gallery permission.");
        }

        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!r.canceled) {
            setSourceUri(r.assets[0].uri);
            setPredictUri(null);
            setResult(null);
            setActiveTipId(null);
        }
    }

    async function takePhoto() {
        const perm = await ImagePicker.requestCameraPermissionsAsync();

        if (perm.status !== "granted") {
            return Alert.alert("Permission", "Please allow camera permission.");
        }

        const r = await ImagePicker.launchCameraAsync({
            quality: 1,
            base64: false,
        });

        if (!r.canceled) {
            setSourceUri(r.assets[0].uri);
            setPredictUri(null);
            setResult(null);
            setActiveTipId(null);
        }
    }

    async function predict() {
        if (!sourceUri) {
            return Alert.alert("No image", "Pick or take a photo first.");
        }

        try {
            setLoading(true);

            const optimizedUri = await optimizeImage(sourceUri);
            setPredictUri(optimizedUri);

            const token = await getToken();
            const data = await predictImageFromUri(optimizedUri, token);
            setResult(data);
            setActiveTipId(null);
        } catch (e) {
            Alert.alert("Prediction error", e.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    const detections = useMemo(() => filterDetections(result), [result]);
    const imageW = result?.imageWidth || 1;
    const imageH = result?.imageHeight || 1;
    const shownUri = predictUri || sourceUri;
    const colors = getColors(theme);

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.page }]}>
            <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>Detect recyclable waste</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                    Take a photo or select one from the gallery, then review labels and boxes.
                </Text>
            </View>

            <View style={styles.actionRow}>
                <Pressable style={[styles.secondaryButton, { backgroundColor: colors.soft }]} onPress={takePhoto}>
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Take Photo</Text>
                </Pressable>

                <Pressable style={[styles.secondaryButton, { backgroundColor: colors.soft }]} onPress={pickFromGallery}>
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Choose Image</Text>
                </Pressable>
            </View>

            <Pressable style={styles.primaryButton} onPress={predict} disabled={loading}>
                <Text style={styles.primaryButtonText}>
                    {loading ? "Analyzing..." : "Run Detection"}
                </Text>
            </Pressable>

            {shownUri && (
                <View style={[styles.imageCard, { backgroundColor: colors.card }]}>
                    <View
                        style={[styles.imageWrap, { backgroundColor: colors.image }]}
                        onLayout={(e) => {
                            const { width } = e.nativeEvent.layout;
                            setLayout({ w: width, h: width / (imageW / imageH) });
                        }}
                    >
                        <Image
                            source={{ uri: shownUri }}
                            style={[styles.image, { aspectRatio: imageW / imageH }]}
                            resizeMode="cover"
                        />

                        <DetectionBoxes
                            detections={detections}
                            imageWidth={imageW}
                            imageHeight={imageH}
                            layout={layout}
                        />
                    </View>
                </View>
            )}

            {loading && (
                <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            )}

            {result?.noWaste && (
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>NO_WASTE</Text>
                    <Text style={[styles.infoText, { color: colors.muted }]}>No detectable waste found.</Text>
                </View>
            )}

            {!result?.noWaste && detections.length > 0 && (
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Detections ({detections.length})</Text>

                    {detections.map((det, index) => {
                        const tipId = String(det.id || `${det.label}-${index}`);
                        const classTip = getClassTip(det.label);
                        const color = getBinColor(det.label, det.binColor);
                        const isTipActive = activeTipId === tipId;

                        return (
                        <Pressable
                            key={`${tipId}-card`}
                            style={[
                                styles.detectCard,
                                { backgroundColor: colors.card, borderColor: color },
                            ]}
                        >
                            <Pressable
                                style={styles.detectTitleButton}
                                onPress={() => setActiveTipId(tipId)}
                            >
                                <Text style={[styles.detectTitle, { borderBottomColor: color, color: colors.text }]}>
                                    {det.label}
                                </Text>
                            </Pressable>

                            {isTipActive && (
                                <View style={[styles.tipCard, { backgroundColor: colors.nested, borderColor: colors.border, borderTopColor: color }]}>
                                    <View style={styles.tipHeader}>
                                        <View style={styles.tipHeaderText}>
                                            <Text style={[styles.tipTitle, { color: colors.text }]}>{classTip.title}</Text>
                                            <Text style={styles.tipStatus}>
                                                {classTip.recyclable ? "Recyclable" : "Special collection required"}
                                            </Text>
                                        </View>

                                        <Pressable
                                            style={styles.tipCloseButton}
                                            onPress={() => setActiveTipId(null)}
                                            hitSlop={10}
                                        >
                                            <Text style={styles.tipCloseText}>X</Text>
                                        </Pressable>
                                    </View>
                                    <Text style={styles.tipLabel}>Tips</Text>
                                    {classTip.tips.map((tip) => (
                                        <Text key={tip} style={[styles.tipText, { color: colors.muted }]}>
                                            - {tip}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            <Text style={[styles.detectText, { color: colors.muted }]}>
                                Confidence: {((det.confidence || 0) * 100).toFixed(1)}%
                            </Text>
                        </Pressable>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#F7F8F6",
        gap: 14,
    },
    heroCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#17221B",
        marginBottom: 6,
    },
    subtitle: {
        color: "#5F6F64",
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#F2F5F1",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: "#17221B",
        fontWeight: "700",
    },
    primaryButton: {
        backgroundColor: "#236B45",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    imageCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    imageWrap: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: 14,
        backgroundColor: "#EEF2EA",
    },
    image: {
        width: "100%",
    },
    box: {
        position: "absolute",
        borderWidth: 3,
        borderRadius: 12,
    },
    badge: {
        position: "absolute",
        top: 6,
        left: 6,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    loadingCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E1E6DE",
        alignItems: "center",
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        gap: 10,
        borderWidth: 1,
        borderColor: "#E1E6DE",
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#17221B",
    },
    infoText: {
        color: "#5F6F64",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#17221B",
    },
    detectCard: {
        borderWidth: 2,
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#fff",
    },
    detectTitleButton: {
        alignSelf: "flex-start",
    },
    detectTitle: {
        fontWeight: "700",
        fontSize: 16,
        color: "#142033",
        marginBottom: 4,
        borderBottomWidth: 2,
    },
    detectText: {
        color: "#607080",
    },
    tipCard: {
        borderWidth: 1,
        borderColor: "#DCE5EF",
        borderTopWidth: 4,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: "#FAFCFF",
    },
    tipHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    tipHeaderText: {
        flex: 1,
    },
    tipCloseButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF2F7",
    },
    tipCloseText: {
        color: "#142033",
        fontSize: 20,
        fontWeight: "700",
        lineHeight: 22,
    },
    tipTitle: {
        color: "#142033",
        fontSize: 16,
        fontWeight: "700",
    },
    tipStatus: {
        color: "#2E7D32",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2,
    },
    tipLabel: {
        color: "#7A8796",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.6,
        marginTop: 10,
        textTransform: "uppercase",
    },
    tipText: {
        color: "#526071",
        lineHeight: 19,
        marginTop: 4,
    },
});

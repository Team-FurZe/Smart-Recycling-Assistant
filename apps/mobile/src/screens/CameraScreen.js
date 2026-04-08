import React, { useMemo, useState } from "react";
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

export default function CameraScreen() {
    const [sourceUri, setSourceUri] = useState(null);
    const [predictUri, setPredictUri] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState({ w: 1, h: 1 });

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
            const uri = r.assets[0].uri;
            setSourceUri(uri);
            setPredictUri(null);
            setResult(null);
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
            const uri = r.assets[0].uri;
            setSourceUri(uri);
            setPredictUri(null);
            setResult(null);
        }
    }

    async function optimizeImage(uri) {
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1024 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulated.uri;
        } catch {
            return uri;
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
        } catch (e) {
            Alert.alert("Prediction error", e.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    const detections = useMemo(() => result?.detections || [], [result]);

    const imageW = result?.imageWidth || 1;
    const imageH = result?.imageHeight || 1;

    const scale = useMemo(() => {
        return {
            sx: layout.w / imageW,
            sy: layout.h / imageH,
        };
    }, [layout, imageW, imageH]);

    const shownUri = predictUri || sourceUri;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.heroCard}>
                <Text style={styles.title}>Detect recyclable waste</Text>
                <Text style={styles.subtitle}>
                    Take a photo or select one from the gallery, then review labels and boxes.
                </Text>
            </View>

            <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={takePhoto}>
                    <Text style={styles.secondaryButtonText}>Take Photo</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={pickFromGallery}>
                    <Text style={styles.secondaryButtonText}>Choose Image</Text>
                </Pressable>
            </View>

            <Pressable style={styles.primaryButton} onPress={predict} disabled={loading}>
                <Text style={styles.primaryButtonText}>
                    {loading ? "Analyzing..." : "Run Detection"}
                </Text>
            </Pressable>

            {shownUri && (
                <View style={styles.imageCard}>
                    <View
                        style={styles.imageWrap}
                        onLayout={(e) => {
                            const { width } = e.nativeEvent.layout;
                            const ratio = imageW / imageH;
                            const height = width / ratio;
                            setLayout({ w: width, h: height });
                        }}
                    >
                        <Image
                            source={{ uri: shownUri }}
                            style={[styles.image, { aspectRatio: imageW / imageH }]}
                            resizeMode="cover"
                        />

                        {detections.map((det, index) => {
                            const { x, y, width, height } = det.bbox;
                            const left = x * scale.sx;
                            const top = y * scale.sy;
                            const w = width * scale.sx;
                            const h = height * scale.sy;
                            const color = getBinColor(det.label, det.binColor);

                            return (
                                <View
                                    key={det.id || `${det.label}-${index}`}
                                    style={[
                                        styles.box,
                                        {
                                            left,
                                            top,
                                            width: w,
                                            height: h,
                                            borderColor: color,
                                        },
                                    ]}
                                >
                                    <View style={[styles.badge, { backgroundColor: color }]}>
                                        <Text style={styles.badgeText}>{det.label}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {loading && (
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            )}

            {result?.noWaste && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>NO_WASTE</Text>
                    <Text style={styles.infoText}>No detectable waste found.</Text>
                </View>
            )}

            {!result?.noWaste && detections.length > 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Detections ({detections.length})</Text>

                    {detections.map((det, index) => (
                        <View
                            key={det.id || `${det.label}-${index}-card`}
                            style={[
                                styles.detectCard,
                                { borderColor: getBinColor(det.label, det.binColor) },
                            ]}
                        >
                            <Text style={styles.detectTitle}>{det.label}</Text>
                            <Text style={styles.detectText}>
                                Confidence: {((det.confidence || 0) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#F5F7FB",
        gap: 14,
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
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#E9EEF5",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: "#142033",
        fontWeight: "700",
    },
    primaryButton: {
        backgroundColor: "#142033",
        padding: 15,
        borderRadius: 14,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    imageCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 14,
    },
    imageWrap: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: "#E8EDF4",
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
        borderRadius: 22,
        padding: 24,
        alignItems: "center",
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 18,
        gap: 10,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#142033",
    },
    infoText: {
        color: "#607080",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#142033",
    },
    detectCard: {
        borderWidth: 2,
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#fff",
    },
    detectTitle: {
        fontWeight: "700",
        fontSize: 16,
        color: "#142033",
        marginBottom: 4,
    },
    detectText: {
        color: "#607080",
    },
});
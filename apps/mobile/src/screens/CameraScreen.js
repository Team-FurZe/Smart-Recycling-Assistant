import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { predictImageFromUri } from "../lib/api";
import { getToken } from "../lib/authStorage";

const LIVE_FRAME_INTERVAL_MS = 900;
const LIVE_IMAGE_WIDTH = 640;
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

function DetectionBoxes({ detections, imageWidth, imageHeight, layout, badgeCompact }) {
    const scale = useMemo(() => {
        return {
            sx: layout.w / (imageWidth || 1),
            sy: layout.h / (imageHeight || 1),
        };
    }, [layout, imageWidth, imageHeight]);

    return detections.map((det, index) => {
        if (!det.bbox) return null;

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
                    <Text style={[styles.badgeText, badgeCompact && styles.badgeTextCompact]}>
                        {det.label} {Math.round((det.confidence || 0) * 100)}%
                    </Text>
                </View>
            </View>
        );
    });
}

export default function CameraScreen() {
    const cameraRef = useRef(null);
    const liveTimerRef = useRef(null);
    const liveAbortRef = useRef(null);
    const liveInFlightRef = useRef(false);
    const liveModeRef = useRef(false);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [sourceUri, setSourceUri] = useState(null);
    const [predictUri, setPredictUri] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState({ w: 1, h: 1 });
    const [liveLayout, setLiveLayout] = useState({ w: 1, h: 1 });
    const [liveMode, setLiveMode] = useState(false);
    const [liveResult, setLiveResult] = useState(null);
    const [liveBusy, setLiveBusy] = useState(false);
    const [liveError, setLiveError] = useState(null);

    useEffect(() => {
        liveModeRef.current = liveMode;
    }, [liveMode]);

    const optimizeImage = useCallback(async (uri, width = STILL_IMAGE_WIDTH) => {
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width } }],
                { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulated.uri;
        } catch {
            return uri;
        }
    }, []);

    const stopLiveMode = useCallback(() => {
        setLiveMode(false);
        setLiveBusy(false);

        if (liveTimerRef.current) {
            clearTimeout(liveTimerRef.current);
            liveTimerRef.current = null;
        }

        if (liveAbortRef.current) {
            liveAbortRef.current.abort();
            liveAbortRef.current = null;
        }

        liveInFlightRef.current = false;
    }, []);

    const captureAndPredictFrame = useCallback(async () => {
        if (!liveModeRef.current || liveInFlightRef.current || !cameraRef.current) {
            return;
        }

        liveInFlightRef.current = true;
        setLiveBusy(true);

        const controller = new AbortController();
        liveAbortRef.current = controller;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.45,
                base64: false,
                skipProcessing: true,
            });
            const optimizedUri = await optimizeImage(photo.uri, LIVE_IMAGE_WIDTH);
            const token = await getToken();
            const data = await predictImageFromUri(optimizedUri, token, {
                signal: controller.signal,
            });

            if (liveModeRef.current && !controller.signal.aborted) {
                setLiveResult(data);
                setLiveError(null);
            }
        } catch (e) {
            if (e.name !== "AbortError" && liveModeRef.current) {
                setLiveError(e.message ?? "Live detection failed.");
            }
        } finally {
            if (liveAbortRef.current === controller) {
                liveAbortRef.current = null;
            }

            liveInFlightRef.current = false;
            setLiveBusy(false);
        }
    }, [optimizeImage]);

    useEffect(() => {
        if (!liveMode) return undefined;

        function tick() {
            captureAndPredictFrame().finally(() => {
                if (liveModeRef.current) {
                    liveTimerRef.current = setTimeout(tick, LIVE_FRAME_INTERVAL_MS);
                }
            });
        }

        tick();

        return () => {
            if (liveTimerRef.current) {
                clearTimeout(liveTimerRef.current);
                liveTimerRef.current = null;
            }
        };
    }, [captureAndPredictFrame, liveMode]);

    useEffect(() => {
        return stopLiveMode;
    }, [stopLiveMode]);

    async function ensureCameraPermission() {
        const permission = cameraPermission?.granted
            ? cameraPermission
            : await requestCameraPermission();

        if (!permission?.granted) {
            Alert.alert("Permission", "Please allow camera permission.");
            return false;
        }

        return true;
    }

    async function toggleLiveMode() {
        if (liveMode) {
            stopLiveMode();
            return;
        }

        const ok = await ensureCameraPermission();
        if (!ok) return;

        setLiveResult(null);
        setLiveError(null);
        setLiveMode(true);
    }

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
        stopLiveMode();

        const ok = await ensureCameraPermission();
        if (!ok) return;

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

    async function predict() {
        if (!sourceUri) {
            return Alert.alert("No image", "Pick or take a photo first.");
        }

        try {
            setLoading(true);

            const optimizedUri = await optimizeImage(sourceUri, STILL_IMAGE_WIDTH);
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

    const detections = useMemo(() => filterDetections(result), [result]);
    const liveDetections = useMemo(() => filterDetections(liveResult), [liveResult]);
    const imageW = result?.imageWidth || 1;
    const imageH = result?.imageHeight || 1;
    const liveImageW = liveResult?.imageWidth || liveLayout.w || 1;
    const liveImageH = liveResult?.imageHeight || liveLayout.h || 1;
    const shownUri = predictUri || sourceUri;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.heroCard}>
                <Text style={styles.title}>Detect recyclable waste</Text>
                <Text style={styles.subtitle}>
                    Use live detection, take a photo, or select one from the gallery.
                </Text>
            </View>

            <View style={styles.liveCard}>
                <View
                    style={styles.liveCameraWrap}
                    onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        setLiveLayout({ w: width, h: height });
                    }}
                >
                    {cameraPermission?.granted ? (
                        <CameraView
                            ref={cameraRef}
                            style={styles.liveCamera}
                            facing="back"
                            animateShutter={false}
                        />
                    ) : (
                        <View style={styles.cameraPermissionPane}>
                            <Text style={styles.cameraPermissionText}>
                                Camera permission is needed for live detection.
                            </Text>
                        </View>
                    )}

                    <DetectionBoxes
                        detections={liveDetections}
                        imageWidth={liveImageW}
                        imageHeight={liveImageH}
                        layout={liveLayout}
                        badgeCompact
                    />

                    <View style={styles.liveStatusPill}>
                        <View
                            style={[
                                styles.liveStatusDot,
                                liveMode && styles.liveStatusDotActive,
                            ]}
                        />
                        <Text style={styles.liveStatusText}>
                            {liveBusy ? "Analyzing" : liveMode ? "Live" : "Paused"}
                        </Text>
                    </View>
                </View>

                {liveError && <Text style={styles.liveError}>{liveError}</Text>}

                <Pressable
                    style={[styles.primaryButton, liveMode && styles.stopButton]}
                    onPress={toggleLiveMode}
                >
                    <Text style={styles.primaryButtonText}>
                        {liveMode ? "Stop Live Mode" : "Start Live Mode"}
                    </Text>
                </Pressable>
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
    liveCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 14,
        gap: 12,
    },
    liveCameraWrap: {
        position: "relative",
        width: "100%",
        aspectRatio: 3 / 4,
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: "#142033",
    },
    liveCamera: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraPermissionPane: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
    },
    cameraPermissionText: {
        color: "#fff",
        textAlign: "center",
        lineHeight: 20,
    },
    liveStatusPill: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "rgba(20, 32, 51, 0.78)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    liveStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#A7B1BE",
    },
    liveStatusDotActive: {
        backgroundColor: "#4CAF50",
    },
    liveStatusText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    liveError: {
        color: "#C62828",
        fontWeight: "600",
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
    stopButton: {
        backgroundColor: "#B3261E",
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
    badgeTextCompact: {
        fontSize: 11,
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { predictLiveImageFromUri } from "../lib/api";
import { clearAuth, getToken } from "../lib/authStorage";

const LIVE_FRAME_INTERVAL_MS = 450;
const LIVE_IMAGE_WIDTH = 512;
const LIVE_REQUEST_TIMEOUT_MS = 6000;
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
        page: dark ? "#0F1722" : "#F5F7FB",
        card: dark ? "#172235" : "#FFFFFF",
        text: dark ? "#F8FBFF" : "#142033",
        muted: dark ? "#B9C4D3" : "#607080",
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

export default function LiveCameraScreen({ theme = "light", onAuthExpired }) {
    const cameraRef = useRef(null);
    const timerRef = useRef(null);
    const abortRef = useRef(null);
    const inFlightRef = useRef(false);
    const liveModeRef = useRef(false);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [liveMode, setLiveMode] = useState(false);
    const [liveResult, setLiveResult] = useState(null);
    const [liveBusy, setLiveBusy] = useState(false);
    const [liveError, setLiveError] = useState(null);
    const [layout, setLayout] = useState({ w: 1, h: 1 });

    useEffect(() => {
        liveModeRef.current = liveMode;
    }, [liveMode]);

    const optimizeFrame = useCallback(async (uri) => {
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: LIVE_IMAGE_WIDTH } }],
                { compress: 0.45, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulated.uri;
        } catch {
            return uri;
        }
    }, []);

    const stopLiveMode = useCallback(() => {
        setLiveMode(false);
        setLiveBusy(false);
        setLiveResult(null);
        setLiveError(null);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        inFlightRef.current = false;
    }, []);

    const captureAndPredictFrame = useCallback(async () => {
        if (!liveModeRef.current || inFlightRef.current || !cameraRef.current) {
            return;
        }

        inFlightRef.current = true;
        setLiveBusy(true);

        const controller = new AbortController();
        abortRef.current = controller;
        const requestTimeout = setTimeout(() => controller.abort(), LIVE_REQUEST_TIMEOUT_MS);
        let photoUri = null;
        let optimizedUri = null;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.28,
                base64: false,
                skipProcessing: true,
                shutterSound: false,
            });
            photoUri = photo.uri;
            optimizedUri = await optimizeFrame(photoUri);
            const token = await getToken();
            const data = await predictLiveImageFromUri(optimizedUri, token, {
                signal: controller.signal,
            });

            if (liveModeRef.current && !controller.signal.aborted) {
                setLiveResult(data);
                setLiveError(null);
            }
        } catch (e) {
            if (e.name !== "AbortError" && liveModeRef.current) {
                if (e.status === 401 || e.status === 403) {
                    await clearAuth();
                    stopLiveMode();
                    Alert.alert("Session expired", "Please log in again.");
                    onAuthExpired?.();
                    return;
                }

                setLiveError(e.message ?? "Live detection failed.");
            }
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
            }

            inFlightRef.current = false;
            setLiveBusy(false);
            clearTimeout(requestTimeout);

            for (const uri of [photoUri, optimizedUri]) {
                if (uri) {
                    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
                }
            }
        }
    }, [onAuthExpired, optimizeFrame, stopLiveMode]);

    useEffect(() => {
        if (!liveMode) return undefined;

        function tick() {
            captureAndPredictFrame().finally(() => {
                if (liveModeRef.current) {
                    timerRef.current = setTimeout(tick, LIVE_FRAME_INTERVAL_MS);
                }
            });
        }

        tick();

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [captureAndPredictFrame, liveMode]);

    useEffect(() => {
        return stopLiveMode;
    }, [stopLiveMode]);

    async function toggleLiveMode() {
        if (liveMode) {
            stopLiveMode();
            return;
        }

        const permission = cameraPermission?.granted
            ? cameraPermission
            : await requestCameraPermission();

        if (!permission?.granted) {
            Alert.alert("Permission", "Please allow camera permission.");
            return;
        }

        setLiveResult(null);
        setLiveError(null);
        setLiveMode(true);
    }

    const detections = useMemo(() => filterDetections(liveResult), [liveResult]);
    const imageWidth = liveResult?.imageWidth || layout.w || 1;
    const imageHeight = liveResult?.imageHeight || layout.h || 1;
    const colors = getColors(theme);

    return (
        <View style={[styles.container, { backgroundColor: colors.page }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>Live Detection</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Real-time recyclable waste preview.</Text>
            </View>

            <View
                style={styles.cameraWrap}
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setLayout({ w: width, h: height });
                }}
            >
                {cameraPermission?.granted ? (
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                        animateShutter={false}
                        mute
                    />
                ) : (
                    <View style={styles.permissionPane}>
                        <Text style={styles.permissionText}>
                            Camera permission is needed for live detection.
                        </Text>
                    </View>
                )}

                <DetectionBoxes
                    detections={detections}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    layout={layout}
                />

                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, liveMode && styles.statusDotActive]} />
                    <Text style={styles.statusText}>
                        {liveBusy ? "Analyzing" : liveMode ? "Live" : "Paused"}
                    </Text>
                </View>
            </View>

            {liveError && <Text style={styles.errorText}>{liveError}</Text>}

            <Pressable
                style={[styles.primaryButton, liveMode && styles.stopButton]}
                onPress={toggleLiveMode}
            >
                <Text style={styles.primaryButtonText}>
                    {liveMode ? "Stop Live Mode" : "Start Live Mode"}
                </Text>
            </Pressable>

            <View style={styles.footerNote}>
                <Text style={[styles.footerText, { color: colors.muted }]}>
                    Live detections are not saved to history.
                </Text>
                {liveBusy && <ActivityIndicator size="small" color="#2E7D32" />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F5F7FB",
        gap: 14,
    },
    header: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 18,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#142033",
        marginBottom: 6,
    },
    subtitle: {
        color: "#607080",
    },
    cameraWrap: {
        position: "relative",
        flex: 1,
        minHeight: 420,
        overflow: "hidden",
        borderRadius: 22,
        backgroundColor: "#142033",
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    permissionPane: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
    },
    permissionText: {
        color: "#fff",
        textAlign: "center",
        lineHeight: 20,
    },
    statusPill: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "rgba(20, 32, 51, 0.78)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#A7B1BE",
    },
    statusDotActive: {
        backgroundColor: "#4CAF50",
    },
    statusText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
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
        fontSize: 11,
    },
    errorText: {
        color: "#C62828",
        fontWeight: "600",
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
    footerNote: {
        minHeight: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    footerText: {
        color: "#607080",
        fontWeight: "600",
    },
});

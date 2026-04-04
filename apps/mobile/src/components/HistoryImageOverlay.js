import React, { useMemo } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function HistoryImageOverlay({ imageUrl, predictionJson }) {
    const parsed = useMemo(() => {
        if (!predictionJson) return null;

        try {
            return JSON.parse(predictionJson);
        } catch {
            return null;
        }
    }, [predictionJson]);

    const detections = parsed?.detections || [];
    const imageWidth = parsed?.imageWidth || 1;
    const imageHeight = parsed?.imageHeight || 1;

    return (
        <View style={styles.wrapper}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

            <View style={styles.overlay}>
                {detections.map((item, index) => {
                    const bbox = item?.bbox;
                    if (!bbox) return null;

                    const left = `${(bbox.x / imageWidth) * 100}%`;
                    const top = `${(bbox.y / imageHeight) * 100}%`;
                    const width = `${(bbox.width / imageWidth) * 100}%`;
                    const height = `${(bbox.height / imageHeight) * 100}%`;

                    return (
                        <View
                            key={`${item.id || item.label}-${index}`}
                            style={[
                                styles.box,
                                {
                                    left,
                                    top,
                                    width,
                                    height,
                                },
                            ]}
                        >
                            <Text style={styles.boxLabel}>
                                {item.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        width: "100%",
        aspectRatio: 1.35,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#F1F5F9",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    box: {
        position: "absolute",
        borderWidth: 2,
        borderColor: "#22C55E",
        backgroundColor: "rgba(34, 197, 94, 0.08)",
    },
    boxLabel: {
        position: "absolute",
        top: -22,
        left: 0,
        backgroundColor: "#22C55E",
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
});
import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function HistoryImageOverlay({ imageUrl, predictionJson }) {
    const [layout, setLayout] = useState({ w: 1, h: 1 });

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

    const scale = {
        sx: layout.w / imageWidth,
        sy: layout.h / imageHeight,
    };

    return (
        <View
            style={styles.wrapper}
            onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                const height = width / (imageWidth / imageHeight);
                setLayout({ w: width, h: height });
            }}
        >
            <Image
                source={{ uri: imageUrl }}
                style={[styles.image, { aspectRatio: imageWidth / imageHeight }]}
                resizeMode="cover"
            />

            <View style={styles.overlay}>
                {detections.map((item, index) => {
                    const bbox = item?.bbox;
                    if (!bbox) return null;

                    const left = bbox.x * scale.sx;
                    const top = bbox.y * scale.sy;
                    const width = bbox.width * scale.sx;
                    const height = bbox.height * scale.sy;
                    const color = item.binColor || "#4CAF50";

                    return (
                        <View
                            key={item.id || `${item.label}-${index}`}
                            style={[
                                styles.box,
                                {
                                    left,
                                    top,
                                    width,
                                    height,
                                    borderColor: color,
                                },
                            ]}
                        >
                            <View style={[styles.label, { backgroundColor: color }]}>
                                <Text style={styles.labelText}>{item.label}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {detections.length > 0 && (
                <View style={styles.legend}>
                    {detections.map((item, index) => (
                        <View
                            key={item.id || `${item.label}-${index}-legend`}
                            style={styles.legendBadge}
                        >
                            <View
                                style={[
                                    styles.legendDot,
                                    { backgroundColor: item.binColor || "#4CAF50" },
                                ]}
                            />
                            <Text style={styles.legendText}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: "#E8EDF4",
    },
    image: {
        width: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    box: {
        position: "absolute",
        borderWidth: 3,
        borderRadius: 10,
    },
    label: {
        position: "absolute",
        top: 6,
        left: 6,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    labelText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    legend: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    legendBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(20,32,51,0.82)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
    },
    legendText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
});
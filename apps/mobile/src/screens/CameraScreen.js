import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { predictImageFromUri } from "../lib/api";

// (Opsiyonel) Eğer override label değişince binColor da değişsin istersen:
const BIN_COLORS = {
  BIODEGRADABLE: "#8BC34A",
  CARDBOARD: "#A1887F",
  GLASS: "#4CAF50",
  METAL: "#9E9E9E",
  PAPER: "#2196F3",
  PLASTIC: "#FFC107",
};
function binColorOf(label) {
  return BIN_COLORS[label] || "#FFFFFF";
}

export default function CameraScreen() {
  const [sourceUri, setSourceUri] = useState(null);   // seçilen/çekilen orijinal
  const [predictUri, setPredictUri] = useState(null); // ✅ YOLO'ya gönderdiğimiz (optimize edilmiş) uri

  const [result, setResult] = useState(null); // { imageWidth, imageHeight, noWaste, detections }
  const [loading, setLoading] = useState(false);

  const [retryStateById, setRetryStateById] = useState({}); // { "01": {loading,message} }
  const [overrides, setOverrides] = useState({});           // { "01": "GLASS" }
  const [triedById, setTriedById] = useState({});           // { "01": ["PAPER","METAL"] }

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
      setRetryStateById({});
      setOverrides({});
      setTriedById({});
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
      setRetryStateById({});
      setOverrides({});
      setTriedById({});
    }
  }

  // Uzun kenarı ~1024px'e indir, %80 kalite JPEG'e dönüştür
  async function optimizeImage(uri) {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch (e) {
      return uri;
    }
  }

  async function predict() {
    if (!sourceUri) {
      return Alert.alert("No image", "Pick or take a photo first.");
    }
    try {
      setLoading(true);

      // ✅ ÖNEMLİ: bbox koordinatları doğru olsun diye
      // YOLO'ya gönderdiğimiz optimize edilmiş uri'yi hem saklıyoruz hem de görüntülüyoruz.
        const token = await getToken();
        const optimizedUri = await optimizeImage(sourceUri);
      setPredictUri(optimizedUri);

      const data = await predictImageFromUri(optimizedUri, token);
      setResult(data);

      setRetryStateById({});
      setOverrides({});
      setTriedById({});
    } catch (e) {
      Alert.alert("Prediction error", e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
    console.log("sourceUri:", sourceUri);
    console.log("predictUri:", optimizedUri);

  }

  function addTried(id, label) {
    setTriedById((prev) => {
      const arr = prev[id] ? [...prev[id]] : [];
      if (!arr.includes(label)) arr.push(label);
      return { ...prev, [id]: arr };
    });
  }

  async function cropByBBox(uri, bbox) {
    const crop = {
      originX: Math.max(0, Math.floor(bbox.x)),
      originY: Math.max(0, Math.floor(bbox.y)),
      width: Math.max(1, Math.floor(bbox.width)),
      height: Math.max(1, Math.floor(bbox.height)),
    };

    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );

    return out.uri;
  }

  async function onTryAgain(det) {
    if (!predictUri) return;

    setRetryStateById((prev) => ({
      ...prev,
      [det.id]: { loading: true, message: "" },
    }));

    try {
      const cropUri = await cropByBBox(predictUri, det.bbox);
      const cropRes = await predictYoloFromUri(cropUri);

      const currentLabel = overrides[det.id] || det.label;
      const tried = triedById[det.id] || [];

      if (cropRes?.noWaste || !cropRes?.detections?.length) {
        setRetryStateById((prev) => ({
          ...prev,
          [det.id]: { loading: false, message: "Try again: no detection found on crop." },
        }));
        return;
      }

      const candidates = cropRes.detections;
      const firstDifferent = candidates.find(
        (c) => c.label !== currentLabel && !tried.includes(c.label)
      );

      if (!firstDifferent) {
        const fallback = candidates[0]?.label;
        if (fallback) addTried(det.id, fallback);

        setRetryStateById((prev) => ({
          ...prev,
          [det.id]: { loading: false, message: "Try again: different result not found (same as before)." },
        }));
        return;
      }

      const newLabel = firstDifferent.label;
      addTried(det.id, newLabel);

      setOverrides((prev) => ({ ...prev, [det.id]: newLabel }));
      setRetryStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Updated to: ${newLabel}` },
      }));
    } catch (e) {
      setRetryStateById((prev) => ({
        ...prev,
        [det.id]: { loading: false, message: `Error: ${e.message || e}` },
      }));
    }
  }

  const viewDetections = useMemo(() => {
    const base = result?.detections || [];
    return base.map((d) => {
      const newLabel = overrides[d.id];
      if (!newLabel) return d;

      return {
        ...d,
        label: newLabel,
        binColor: binColorOf(newLabel), // ✅ override olunca renk de değişsin
      };
    });
  }, [result, overrides]);

  const imageW = result?.imageWidth || 1;
  const imageH = result?.imageHeight || 1;

  const scale = useMemo(() => {
    return { sx: layout.w / imageW, sy: layout.h / imageH };
  }, [layout, imageW, imageH]);

  const shownUri = predictUri || sourceUri;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Recycle Assistant (Mobile)</Text>

      <View style={styles.row}>
        <Button title="Pick from Gallery" onPress={pickFromGallery} />
        <View style={{ width: 12 }} />
        <Button title="Take Photo" onPress={takePhoto} />
      </View>

      {shownUri && (
        <View
          style={{ marginTop: 16 }}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            const ratio = imageW / imageH; // width/height
            const height = width / ratio;
            setLayout({ w: width, h: height });
          }}
        >
          {/* ✅ aspect ratio'yu server'dan gelen imageWidth/imageHeight ile sabitliyoruz.
              Böylece bbox overlay doğru oturuyor (letterbox/padding yok). */}
          <ImageBackground
            source={{ uri: shownUri }}
            style={{
              width: "100%",
              height: layout.h,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#000",
            }}
            resizeMode="stretch"
          >
            {/* Boxes overlay */}
            {(viewDetections || []).map((det) => {
              const { x, y, width, height } = det.bbox;
              const left = x * scale.sx;
              const top = y * scale.sy;
              const w = width * scale.sx;
              const h = height * scale.sy;

              return (
                <View
                  key={det.id}
                  style={[
                    styles.box,
                    {
                      left,
                      top,
                      width: w,
                      height: h,
                      borderColor: det.binColor,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View style={[styles.badge, { backgroundColor: det.binColor }]}>
                    <Text style={styles.badgeText}>{det.id}</Text>
                  </View>
                </View>
              );
            })}
          </ImageBackground>
        </View>
      )}

      <View style={{ height: 12 }} />
      <Button
        title={loading ? "Predicting..." : "Predict"}
        onPress={predict}
        disabled={!sourceUri || loading}
      />

      <View style={{ height: 16 }} />
      {loading && <ActivityIndicator size="large" />}

      {/* NO_WASTE */}
      {result?.noWaste && (
        <View style={styles.noWasteCard}>
          <Text style={styles.noWasteText}>NO_WASTE — No detectable waste found.</Text>
        </View>
      )}

      {/* Detections list */}
      {!result?.noWaste && Array.isArray(viewDetections) && viewDetections.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>
            Detections ({viewDetections.length})
          </Text>

          {viewDetections.map((det) => {
            const retry = retryStateById?.[det.id] || { loading: false, message: "" };

            return (
              <View key={det.id} style={[styles.card, { borderColor: det.binColor }]}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      #{det.id} — {det.label}
                    </Text>
                    <Text style={styles.cardSub}>
                      Confidence: {(det.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onTryAgain(det)}
                    disabled={retry.loading}
                    style={({ pressed }) => [
                      styles.tryBtn,
                      {
                        borderColor: det.binColor,
                        opacity: retry.loading ? 0.5 : pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.tryBtnText}>
                      {retry.loading ? "Trying..." : "Try again"}
                    </Text>
                  </Pressable>
                </View>

                {!!retry.message && <Text style={styles.tryMsg}>{retry.message}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "stretch" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignSelf: "center" },

  box: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    left: 6,
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: "900",
    fontSize: 12,
    color: "#111",
  },

  noWasteCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  noWasteText: { fontWeight: "800" },

  sectionTitle: { fontWeight: "800", marginBottom: 10, fontSize: 16 },

  card: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  cardRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  cardTitle: { fontWeight: "900", fontSize: 14 },
  cardSub: { marginTop: 2, color: "#555", fontSize: 12 },

  tryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tryBtnText: { fontWeight: "800" },
  tryMsg: { marginTop: 8, color: "#555", fontSize: 12 },
});

import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { predictImageFromUri } from "../lib/api"; // BACKEND_URL burada yönetiliyor

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Labels that user said are wrong
  const [excludedLabels, setExcludedLabels] = useState([]);

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
      setImageUri(r.assets[0].uri);
      setResult(null);
      setExcludedLabels([]); // reset feedback state
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
      setImageUri(r.assets[0].uri);
      setResult(null);
      setExcludedLabels([]); // reset feedback state
    }
  }

  // Uzun kenarı ~1024px'e indir, %80 kalite JPEG'e dönüştür
  async function optimizeImage(uri) {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // height otomatik orantılanır
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch (e) {
      // Optimizasyon başarısızsa orijinali gönder
      return uri;
    }
  }

  async function predict() {
    if (!imageUri)
      return Alert.alert("No image", "Pick or take a photo first.");
    try {
      setLoading(true);
      const optimizedUri = await optimizeImage(imageUri);
      const data = await predictImageFromUri(optimizedUri);
      setResult(data);
      setExcludedLabels([]); // new prediction, clear previous excluded labels
    } catch (e) {
      Alert.alert("Prediction error", e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Feedback: try another label without excluded ones
  function handleFeedback() {
    if (!result || !result.probabilities) return;

    const currentLabel = result.label;

    // 1) Update excluded list
    const updatedExcluded = excludedLabels.includes(currentLabel)
      ? excludedLabels
      : [...excludedLabels, currentLabel];

    // 2) Build candidates from probabilities excluding these labels
    const entries = Object.entries(result.probabilities);

    const candidates = entries
      .filter(([label]) => !updatedExcluded.includes(label))
      .sort((a, b) => b[1] - a[1]); // sort desc by probability

    if (candidates.length === 0) {
      setExcludedLabels(updatedExcluded);
      Alert.alert(
        "No more categories",
        "No other categories left to suggest. Please select the correct one manually."
      );
      return;
    }

    // 3) Pick next best
    const [nextLabel, nextProb] = candidates[0];

    // 4) Update state
    setExcludedLabels(updatedExcluded);
    setResult((prev) =>
      prev
        ? {
            ...prev,
            label: nextLabel,
            confidence: nextProb,
          }
        : prev
    );
  }

  const hasProbabilities =
    result &&
    result.probabilities &&
    Object.keys(result.probabilities).length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Recycle Assistant (Mobile)</Text>

      <View style={styles.row}>
        <Button title="Pick from Gallery" onPress={pickFromGallery} />
        <View style={{ width: 12 }} />
        <Button title="Take Photo" onPress={takePhoto} />
      </View>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.preview}
          resizeMode="cover"
        />
      )}

      <View style={{ height: 12 }} />
      <Button
        title={loading ? "Predicting..." : "Predict"}
        onPress={predict}
        disabled={!imageUri || loading}
      />

      <View style={{ height: 16 }} />
      {loading && <ActivityIndicator size="large" />}

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prediction</Text>
          <Text>Label: {result.label}</Text>
          <Text>
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </Text>
          <Text>Bin Color: {result.binColor}</Text>

          {excludedLabels.length > 0 && (
            <Text style={styles.excludedText}>
              Ignored categories: {excludedLabels.join(", ")}
            </Text>
          )}

          {hasProbabilities && (
            <View style={{ marginTop: 8 }}>
              <Button
                title="This looks wrong, try another"
                onPress={handleFeedback}
              />
            </View>
          )}

          {Array.isArray(result.tips) &&
            result.tips.map((t, i) => (
              <Text key={i}>• {t}</Text>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "stretch" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignSelf: "center" },
  preview: { marginTop: 16, width: "100%", height: 260, borderRadius: 12 },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTitle: { fontWeight: "600", marginBottom: 4 },
  excludedText: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
});

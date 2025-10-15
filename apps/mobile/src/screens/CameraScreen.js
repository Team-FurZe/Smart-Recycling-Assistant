import React, { useState } from "react";
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { predictImageFromUri } from "../lib/api";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return Alert.alert("Permission", "Allow gallery permission.");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) { setImageUri(r.assets[0].uri); setResult(null); }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") return Alert.alert("Permission", "Allow camera permission.");
    const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!r.canceled) { setImageUri(r.assets[0].uri); setResult(null); }
  }

  async function predict() {
    if (!imageUri) return Alert.alert("No image", "Pick or take a photo first.");
    try { setLoading(true); setResult(await predictImageFromUri(imageUri)); }
    catch (e) { Alert.alert("Prediction error", e.message || "Unknown error"); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Recycle Assistant (Mobile)</Text>
      <View style={styles.row}>
        <Button title="Gallery" onPress={pickFromGallery} />
        <View style={{ width: 12 }} />
        <Button title="Camera" onPress={takePhoto} />
      </View>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />}
      <View style={{ height: 12 }} />
      <Button title="Predict" onPress={predict} disabled={!imageUri || loading} />
      <View style={{ height: 16 }} />
      {loading && <ActivityIndicator size="large" />}
      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prediction</Text>
          <Text>Label: {result.label}</Text>
          <Text>Confidence: {(result.confidence * 100).toFixed(2)}%</Text>
          <Text>Bin Color: {result.binColor}</Text>
          {Array.isArray(result.tips) && result.tips.map((t,i)=> <Text key={i}>• {t}</Text>)}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container:{ padding:16, alignItems:"stretch" },
  title:{ fontSize:22, fontWeight:"600", textAlign:"center", marginBottom:16 },
  row:{ flexDirection:"row", alignSelf:"center" },
  preview:{ marginTop:16, width:"100%", height:260, borderRadius:12 },
  card:{ marginTop:16, padding:16, borderRadius:12, borderWidth:1, borderColor:"#ddd", backgroundColor:"#fff", gap:6 },
  cardTitle:{ fontWeight:"600", marginBottom:4 }
});

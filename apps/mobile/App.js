import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CameraScreen from "./src/screens/CameraScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <CameraScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

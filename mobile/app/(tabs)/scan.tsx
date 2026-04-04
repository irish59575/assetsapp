import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { useAssetByScan } from "@/hooks/useAssets";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const { data: asset, isLoading, error } = useAssetByScan(qrData);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === "granted");
    });
  }, []);

  useEffect(() => {
    if (asset) {
      router.push(`/asset/${asset.id}`);
      setScanned(false);
      setQrData(null);
    }
  }, [asset]);

  useEffect(() => {
    if (error && qrData) {
      Alert.alert("Not Found", "No asset found for this QR code.", [
        { text: "Scan Again", onPress: () => { setScanned(false); setQrData(null); } },
      ]);
    }
  }, [error, qrData]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setQrData(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera permission is required to scan QR codes.</Text>
        <Pressable
          style={styles.button}
          onPress={() => Camera.requestCameraPermissionsAsync().then(({ status }) => setHasPermission(status === "granted"))}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Point at a QR code or barcode</Text>
          <View style={styles.viewfinder} />
          {(scanned || isLoading) && (
            <View style={styles.scanningBadge}>
              <Text style={styles.scanningText}>
                {isLoading ? "Looking up asset..." : "Scanned!"}
              </Text>
            </View>
          )}
          {scanned && !isLoading && (
            <Pressable
              style={styles.rescanButton}
              onPress={() => { setScanned(false); setQrData(null); }}
            >
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </Pressable>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  overlayText: { color: "#fff", fontSize: 15, fontWeight: "500", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  viewfinder: { width: 240, height: 240, borderWidth: 3, borderColor: "#fff", borderRadius: 12, opacity: 0.8 },
  scanningBadge: { backgroundColor: "rgba(37,99,235,0.85)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  scanningText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  rescanButton: { backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  rescanText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  message: { color: "#374151", fontSize: 15, textAlign: "center" },
  button: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: "#fff", fontWeight: "600" },
});

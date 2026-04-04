import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Modal, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import api from "@/lib/api";
import type { Device } from "@/types";

type ScanState = "idle" | "loading" | "found" | "unassigned" | "unknown" | "error";
type OverlayPrompt = "none" | "not_registered" | "error";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [labelCode, setLabelCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [overlayPrompt, setOverlayPrompt] = useState<OverlayPrompt>("none");

  // Device search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Device[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === "granted");
    });
  }, []);

  const reset = () => {
    setScanned(false);
    setScanState("idle");
    setLabelCode(null);
    setShowModal(false);
    setOverlayPrompt("none");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLabelCode(data);
    setScanState("loading");

    try {
      const res = await api.get(`/labels/${encodeURIComponent(data)}`);
      const label = res.data;
      if (label.status === "assigned" && label.device_id) {
        setScanState("found");
        router.push(`/device/${label.device_id}` as `/${string}`);
        setTimeout(reset, 1000);
      } else {
        setScanState("unassigned");
        setShowModal(true);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail === "Label not found") {
        setScanState("unknown");
        setOverlayPrompt("not_registered");
      } else {
        setScanState("error");
        setOverlayPrompt("error");
      }
    }
  };

  const handleSearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<Device[]>("/devices", { params: { search: text, limit: 20 } });
      setSearchResults(res.data);
    } catch (e: any) {
      console.error("Device search error:", e?.response?.status, e?.response?.data ?? e?.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleLinkDevice = async (device: Device) => {
    if (!labelCode) return;
    setAssigning(true);
    try {
      // Try to assign label first (register it if it doesn't exist by using generate + assign)
      try {
        await api.post(`/labels/${encodeURIComponent(labelCode)}/assign`, {
          device_id: device.id,
          assigned_by: "Mobile scan",
        });
      } catch (e: any) {
        // If label doesn't exist yet, generate it first then assign
        if (e?.response?.status === 404) {
          await api.post("/labels/generate", { count: 1, prefix: labelCode.split("-")[0] || "PRES" });
          await api.post(`/labels/${encodeURIComponent(labelCode)}/assign`, {
            device_id: device.id,
            assigned_by: "Mobile scan",
          });
        } else {
          throw e;
        }
      }
      setShowModal(false);
      router.push(`/device/${device.id}` as `/${string}`);
      reset();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Could not link label to device.");
    } finally {
      setAssigning(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.messageTitle}>Camera Access Required</Text>
        <Text style={styles.message}>Allow camera access to scan QR codes.</Text>
        <Pressable
          style={styles.button}
          onPress={() =>
            Camera.requestCameraPermissionsAsync().then(({ status }) =>
              setHasPermission(status === "granted")
            )
          }
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const badgeText =
    scanState === "loading" ? "Looking up label..." :
    scanState === "found" ? "Found! Opening device..." :
    scanState === "error" ? "Error — try again" : null;

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Scan Device Label</Text>
          <Text style={styles.overlaySubtitle}>Point at a QR code to look up or register a device</Text>

          {/* Viewfinder */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          {badgeText && (
            <View style={[styles.badge, scanState === "error" && styles.badgeError]}>
              {scanState === "loading" && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}

          {/* Inline prompt card — replaces Alert */}
          {overlayPrompt === "not_registered" && (
            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>Label Not Registered</Text>
              <Text style={styles.promptMessage}>
                <Text style={styles.promptCode}>{labelCode}</Text>
                {" "}is not in the system yet.
              </Text>
              <View style={styles.promptButtons}>
                <Pressable style={styles.promptCancel} onPress={reset}>
                  <Text style={styles.promptCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.promptConfirm}
                  onPress={() => { setOverlayPrompt("none"); setShowModal(true); }}
                >
                  <Text style={styles.promptConfirmText}>Register & Link</Text>
                </Pressable>
              </View>
            </View>
          )}

          {overlayPrompt === "error" && (
            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>Something went wrong</Text>
              <Text style={styles.promptMessage}>Could not look up this QR code.</Text>
              <Pressable style={styles.promptConfirm} onPress={reset}>
                <Text style={styles.promptConfirmText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {scanned && overlayPrompt === "none" && scanState !== "loading" && scanState !== "found" && (
            <Pressable style={styles.rescanBtn} onPress={reset}>
              <Text style={styles.rescanText}>↩ Scan Again</Text>
            </Pressable>
          )}
        </View>
      </CameraView>

      {/* Link to device bottom sheet */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={reset}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrapper}>
          <Pressable style={styles.modalBackdrop} onPress={reset} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Link Label to Device</Text>
            <View style={styles.labelCodeRow}>
              <Text style={styles.labelCodeLabel}>Label:</Text>
              <Text style={styles.labelCodeValue}>{labelCode}</Text>
            </View>
            <Text style={styles.sheetHint}>
              {scanState === "unassigned"
                ? "This label exists but isn't linked to a device yet."
                : "This label isn't registered. Search for a device to link it to."}
            </Text>

            {/* Search box */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by device name or serial..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color="#2563eb" />}
            </View>

            {/* Results */}
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.id)}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.resultItem}
                    onPress={() => handleLinkDevice(item)}
                    disabled={assigning}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{item.device_name}</Text>
                      <Text style={styles.resultMeta}>
                        {[item.manufacturer, item.serial_number].filter(Boolean).join(" · ") || "No serial"}
                      </Text>
                    </View>
                    {assigning ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Text style={styles.linkBtn}>Link →</Text>
                    )}
                  </Pressable>
                )}
              />
            ) : searchQuery.length >= 2 && !searching ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No devices found for "{searchQuery}"</Text>
              </View>
            ) : searchQuery.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>Type at least 2 characters to search</Text>
              </View>
            ) : null}

            <Pressable style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  overlayTitle: {
    color: "#fff", fontSize: 18, fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 },
  },
  overlaySubtitle: {
    color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  viewfinderContainer: { marginVertical: 16 },
  viewfinder: { width: 240, height: 240, position: "relative" },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#fff" },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  badge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(37,99,235,0.9)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99,
  },
  badgeError: { backgroundColor: "rgba(220,38,38,0.9)" },
  badgeText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  rescanBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 99 },
  rescanText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16, backgroundColor: "#f9fafb" },
  messageTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  message: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  button: { backgroundColor: "#2563eb", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Modal
  modalWrapper: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)" } as any,
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: "85%", gap: 10,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 99, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  labelCodeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  labelCodeLabel: { fontSize: 13, color: "#6b7280" },
  labelCodeValue: { fontSize: 14, fontWeight: "700", color: "#4f46e5", fontFamily: "monospace" },
  sheetHint: { fontSize: 13, color: "#6b7280" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#f9fafb",
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  resultsList: { maxHeight: 240 },
  resultItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  resultName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  resultMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  linkBtn: { color: "#2563eb", fontWeight: "700", fontSize: 14, paddingLeft: 12 },
  noResults: { paddingVertical: 20, alignItems: "center" },
  noResultsText: { color: "#9ca3af", fontSize: 14 },
  promptCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20, marginHorizontal: 16,
    gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  promptTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  promptMessage: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  promptCode: { fontWeight: "700", color: "#4f46e5" },
  promptButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  promptCancel: {
    flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingVertical: 11, alignItems: "center",
  },
  promptCancelText: { color: "#6b7280", fontWeight: "600", fontSize: 14 },
  promptConfirm: {
    flex: 1, backgroundColor: "#2563eb", borderRadius: 10,
    paddingVertical: 11, alignItems: "center",
  },
  promptConfirmText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cancelBtn: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12,
    paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  cancelText: { color: "#6b7280", fontWeight: "600", fontSize: 15 },
});

import React from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Pressable, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useAsset, useDeleteAsset } from "@/hooks/useAssets";
import type { AssetStatus } from "@/types";

const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#15803d" },
  inactive: { bg: "#f3f4f6", text: "#4b5563" },
  maintenance: { bg: "#fef9c3", text: "#a16207" },
  disposed: { bg: "#fee2e2", text: "#dc2626" },
  lost: { bg: "#ffedd5", text: "#c2410c" },
};

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = Number(id);

  const { data: asset, isLoading, error } = useAsset(assetId);
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

  const handleDelete = () => {
    Alert.alert("Delete Asset", "This will permanently delete the asset. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAsset(assetId, { onSuccess: () => router.back() }),
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (error || !asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Asset not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[asset.status] ?? STATUS_COLORS.active;

  const details = [
    { label: "Serial Number", value: asset.serial_number },
    { label: "Barcode", value: asset.barcode },
    { label: "Category", value: asset.category_rel?.name },
    { label: "Location", value: asset.location_rel?.name },
    { label: "Purchase Price", value: asset.purchase_price ? `$${asset.purchase_price}` : null },
    { label: "Added", value: new Date(asset.created_at).toLocaleDateString() },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{asset.status}</Text>
          </View>
        </View>
        {asset.description ? <Text style={styles.description}>{asset.description}</Text> : null}
      </View>

      {/* QR Code */}
      <View style={styles.qrCard}>
        <Text style={styles.sectionTitle}>QR Code</Text>
        <View style={styles.qrWrapper}>
          <QRCode value={`asset:${asset.id}`} size={180} />
        </View>
        <Text style={styles.qrCaption}>ID: asset:{asset.id}</Text>
      </View>

      {/* Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Details</Text>
        {details.map(({ label, value }) =>
          value ? (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ) : null
        )}
      </View>

      {/* Actions */}
      <Pressable
        style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
        onPress={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text style={styles.deleteText}>Delete Asset</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: "#6b7280" },
  backButton: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backButtonText: { color: "#fff", fontWeight: "600" },
  headerCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  assetName: { fontSize: 20, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  description: { marginTop: 6, fontSize: 14, color: "#6b7280", lineHeight: 20 },
  qrCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  qrWrapper: { marginVertical: 12 },
  qrCaption: { fontSize: 12, color: "#9ca3af" },
  detailsCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: { fontSize: 13, fontWeight: "500", color: "#111827", maxWidth: "60%", textAlign: "right" },
  deleteButton: { borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff5f5", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  deleteButtonDisabled: { opacity: 0.5 },
  deleteText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
});

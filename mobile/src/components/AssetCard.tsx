import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import type { Asset, AssetStatus } from "@/types";

interface AssetCardProps {
  asset: Asset;
}

const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#15803d" },
  inactive: { bg: "#f3f4f6", text: "#4b5563" },
  maintenance: { bg: "#fef9c3", text: "#a16207" },
  disposed: { bg: "#fee2e2", text: "#dc2626" },
  lost: { bg: "#ffedd5", text: "#c2410c" },
};

export function AssetCard({ asset }: AssetCardProps) {
  const statusColor = STATUS_COLORS[asset.status] ?? STATUS_COLORS.active;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/asset/${asset.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
          {asset.description ? (
            <Text style={styles.description} numberOfLines={2}>{asset.description}</Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {asset.status}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        {asset.category_rel ? (
          <View style={[styles.tag, { backgroundColor: `${asset.category_rel.color}20` }]}>
            <Text style={[styles.tagText, { color: asset.category_rel.color }]}>
              {asset.category_rel.name}
            </Text>
          </View>
        ) : null}
        {asset.location_rel ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{asset.location_rel.name}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  titleArea: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  description: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  meta: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  tag: { backgroundColor: "#f3f4f6", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: "#4b5563", fontWeight: "500" },
});

export default AssetCard;

import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Pressable, RefreshControl, TextInput,
} from "react-native";
import { router } from "expo-router";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types";

export default function ClientsScreen() {
  const { data: clients = [], isLoading, isError, error, refetch, isFetching } = useClients();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Clients</Text>
          <Text style={styles.headerSub}>{filtered.length} of {clients.length}</Text>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Failed to load clients</Text>
          <Text style={styles.emptyHint}>
            {(error as any)?.response?.data?.detail ?? (error as any)?.message ?? "Unknown error"}
          </Text>
          <Pressable onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ClientCard client={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {search.trim() ? "No clients match your search." : "No clients found."}
              </Text>
              {!search.trim() && (
                <Text style={styles.emptyHint}>Run a LabTech sync to import clients and devices.</Text>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

function ClientCard({ client }: { client: Client }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/client/${client.id}` as `/${string}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
            {client.labtech_client_id ? (
              <Text style={styles.clientId}>ID: {client.labtech_client_id}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalCount}>{client.device_count}</Text>
          <Text style={styles.totalLabel}>devices</Text>
        </View>
      </View>

      <View style={styles.chips}>
        <View style={[styles.chip, styles.chipAvailable]}>
          <Text style={[styles.chipText, styles.chipTextAvailable]}>
            {client.available} available
          </Text>
        </View>
        <View style={[styles.chip, styles.chipAssigned]}>
          <Text style={[styles.chipText, styles.chipTextAssigned]}>
            {client.assigned} assigned
          </Text>
        </View>
        <View style={[styles.chip, styles.chipRepair]}>
          <Text style={[styles.chipText, styles.chipTextRepair]}>
            {client.in_repair} in repair
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280" },
  searchRow: { flexDirection: "row" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  list: { padding: 14 },
  loader: { marginTop: 40 },
  empty: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText: { color: "#9ca3af", fontSize: 16 },
  emptyHint: { color: "#9ca3af", fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  clientId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  totalBadge: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
  },
  totalCount: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  totalLabel: { fontSize: 10, color: "#3b82f6", fontWeight: "500" },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  chipText: { fontSize: 11, fontWeight: "600" },
  chipAvailable: { backgroundColor: "#dcfce7" },
  chipTextAvailable: { color: "#15803d" },
  chipAssigned: { backgroundColor: "#dbeafe" },
  chipTextAssigned: { color: "#1d4ed8" },
  chipRepair: { backgroundColor: "#fef9c3" },
  chipTextRepair: { color: "#a16207" },
});

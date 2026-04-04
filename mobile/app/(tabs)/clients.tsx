import React from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Pressable, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types";

export default function ClientsScreen() {
  const { data: clients = [], isLoading, refetch, isFetching } = useClients();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <Text style={styles.headerSub}>{clients.length} client{clients.length !== 1 ? "s" : ""}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : (
        <FlatList
          data={clients}
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
              <Text style={styles.emptyText}>No clients found.</Text>
              <Text style={styles.emptyHint}>
                Run a LabTech sync to import clients and devices.
              </Text>
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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{client.device_count}</Text>
        <Text style={styles.badgeLabel}>devices</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  badge: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
  },
  badgeText: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  badgeLabel: { fontSize: 10, color: "#3b82f6", fontWeight: "500" },
});

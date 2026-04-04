import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet,
  ActivityIndicator, Pressable, RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useClient, useClientDevices } from "@/hooks/useClients";
import type { Device, DeviceStatus } from "@/types";

const STATUS_TABS: { label: string; value: string | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Available", value: "available" },
  { label: "Assigned", value: "assigned" },
  { label: "In Repair", value: "in_repair" },
];

const STATUS_COLORS: Record<DeviceStatus, { bg: string; text: string }> = {
  available: { bg: "#dcfce7", text: "#15803d" },
  assigned: { bg: "#dbeafe", text: "#1d4ed8" },
  in_repair: { bg: "#fef9c3", text: "#a16207" },
  retired: { bg: "#f3f4f6", text: "#4b5563" },
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Number(id);

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: devices = [], isLoading: devicesLoading, refetch, isFetching } =
    useClientDevices(clientId, activeStatus);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearchChange as Record<string, ReturnType<typeof setTimeout>>)._timer);
    (handleSearchChange as Record<string, ReturnType<typeof setTimeout>>)._timer = setTimeout(
      () => setDebouncedSearch(text),
      400
    );
  };

  const filteredDevices = debouncedSearch
    ? devices.filter(
        (d) =>
          d.device_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (d.serial_number ?? "").toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : devices;

  if (clientLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Client not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.deviceCount}>{client.device_count} device{client.device_count !== 1 ? "s" : ""}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or serial..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.label}
            style={[styles.tab, activeStatus === tab.value && styles.tabActive]}
            onPress={() => setActiveStatus(tab.value)}
          >
            <Text style={[styles.tabText, activeStatus === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {devicesLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDevices}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !devicesLoading}
              onRefresh={refetch}
              tintColor="#2563eb"
            />
          }
          renderItem={({ item }) => <DeviceCard device={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No devices found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const statusColor = STATUS_COLORS[device.status] ?? STATUS_COLORS.available;
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/device/${device.id}` as `/${string}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.deviceName} numberOfLines={1}>{device.device_name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {device.status.replace("_", " ")}
          </Text>
        </View>
      </View>
      {device.serial_number ? (
        <Text style={styles.serial}>S/N: {device.serial_number}</Text>
      ) : null}
      {device.assigned_to ? (
        <Text style={styles.assignedTo}>Assigned to: {device.assigned_to}</Text>
      ) : null}
      <View style={styles.cardMeta}>
        {device.manufacturer ? <Text style={styles.metaText}>{device.manufacturer}</Text> : null}
        {device.model ? <Text style={styles.metaText}>{device.model}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: "#6b7280" },
  backButton: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backButtonText: { color: "#fff", fontWeight: "600" },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  clientName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  deviceCount: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  searchBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "#f3f4f6",
  },
  tabActive: { backgroundColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  list: { padding: 14 },
  loader: { marginTop: 40 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#9ca3af", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deviceName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  serial: { fontSize: 12, color: "#6b7280" },
  assignedTo: { fontSize: 12, color: "#2563eb", fontWeight: "500" },
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaText: { fontSize: 11, color: "#9ca3af" },
});

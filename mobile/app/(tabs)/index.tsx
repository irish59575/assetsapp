import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet,
  ActivityIndicator, Pressable, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAssets } from "@/hooks/useAssets";
import { AssetCard } from "@/components/AssetCard";

export default function AssetsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: assets = [], isLoading, refetch, isFetching } = useAssets(debouncedSearch || undefined);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearchChange as any)._timer);
    (handleSearchChange as any)._timer = setTimeout(() => setDebouncedSearch(text), 400);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={handleSearchChange}
        />
        <Pressable style={styles.addButton} onPress={() => router.push("/asset/new" as any)}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AssetCard asset={item} />}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor="#2563eb" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No assets found.</Text>
              <Pressable onPress={() => router.push("/asset/new" as any)}>
                <Text style={styles.emptyLink}>Add your first asset</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#f9fafb",
  },
  addButton: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  addButtonText: { color: "#fff", fontSize: 24, fontWeight: "400", lineHeight: 30 },
  list: { padding: 14 },
  loader: { marginTop: 40 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#9ca3af", fontSize: 16 },
  emptyLink: { color: "#2563eb", fontSize: 14, fontWeight: "600", marginTop: 8 },
});

import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: logoutMutate, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logoutMutate() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.full_name ?? "Unknown"}</Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Row label="Account Type" value={user?.is_superuser ? "Administrator" : "Standard User"} />
        <Row label="Status" value={user?.is_active ? "Active" : "Inactive"} />
        <Row label="Member Since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color="#dc2626" />
          ) : (
            <Text style={styles.logoutText}>Sign Out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarSection: { alignItems: "center", paddingVertical: 32, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#111827" },
  email: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  section: { backgroundColor: "#fff", marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 14, color: "#6b7280" },
  rowValue: { fontSize: 14, fontWeight: "500", color: "#111827" },
  actions: { padding: 20, marginTop: "auto" },
  logoutButton: { borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff5f5", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
});

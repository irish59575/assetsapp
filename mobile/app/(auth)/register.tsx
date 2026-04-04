import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useRegister } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutate: registerMutate, isPending } = useRegister();

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Validation", "Password must be at least 8 characters.");
      return;
    }
    registerMutate(
      { full_name: fullName.trim(), email: email.trim(), password },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.detail ?? "Registration failed.";
          Alert.alert("Error", msg);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join AssetTracker</Text>

          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9ca3af" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password (min. 8 chars)" placeholderTextColor="#9ca3af" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#9ca3af" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          <Pressable style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleRegister} disabled={isPending}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 28, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 26, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 4, marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#111827", marginBottom: 12,
  },
  button: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  link: { color: "#2563eb", textAlign: "center", marginTop: 18, fontSize: 14, fontWeight: "500" },
});

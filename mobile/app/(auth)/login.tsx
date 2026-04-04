import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useLogin } from "@/hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: loginMutate, isPending } = useLogin();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter your email and password.");
      return;
    }
    loginMutate(
      { email: email.trim(), password },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.detail ?? "Login failed. Check your credentials.";
          Alert.alert("Login Failed", msg);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>AssetTracker</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={[styles.button, isPending && styles.buttonDisabled]} onPress={handleLogin} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/register" as any)}>
          <Text style={styles.link}>Don&apos;t have an account? Register</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 28, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 26, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 4, marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#111827", marginBottom: 12,
  },
  button: {
    backgroundColor: "#2563eb", borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  link: { color: "#2563eb", textAlign: "center", marginTop: 18, fontSize: 14, fontWeight: "500" },
});

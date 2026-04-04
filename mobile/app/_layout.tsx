import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { isAuthenticated } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    isAuthenticated().then((authed) => {
      setChecking(false);
      if (!authed) {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="asset/[id]" options={{ headerShown: true, title: "Asset Detail" }} />
      </Stack>
      {checking && (
        <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
    </QueryClientProvider>
  );
}

import React, { useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
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
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <RootNavigator />
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const [authState, setAuthState] = useState<"checking" | "authed" | "unauthed">("checking");
  const segments = useSegments();

  const checkAuth = async () => {
    const authed = await isAuthenticated();
    setAuthState(authed ? "authed" : "unauthed");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authState === "checking") return;
    const inAuthGroup = segments[0] === "(auth)";
    if (authState === "unauthed" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (authState === "authed" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [authState, segments]);

  // Expose a way for login to notify layout that auth changed
  useEffect(() => {
    // Re-check auth whenever we navigate to tabs (after login)
    if (segments[0] === "(tabs)") {
      checkAuth();
    }
  }, [segments[0]]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="device/[id]" options={{ headerShown: true, title: "Device Detail" }} />
        <Stack.Screen name="client/[id]" options={{ headerShown: true, title: "Client Devices" }} />
      </Stack>
      {authState === "checking" && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
    </>
  );
}

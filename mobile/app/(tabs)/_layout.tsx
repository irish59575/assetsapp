import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          backgroundColor: "#fff",
        },
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Assets",
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} path="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          ),
        }}
      />
    </Tabs>
  );
}

// Inline SVG icon component using raw paths rendered via a View placeholder
// In a real project, use react-native-svg or expo/vector-icons
function TabIcon({ color, size, path }: { color: string; size: number; path: string }) {
  // This is a placeholder – install @expo/vector-icons for production icons
  const React = require("react");
  const { View } = require("react-native");
  return <View style={{ width: size, height: size, opacity: color === "#9ca3af" ? 0.4 : 1, backgroundColor: color, borderRadius: 4 }} />;
}

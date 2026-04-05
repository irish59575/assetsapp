"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClients } from "@/hooks/useClients";
import { useCurrentUser } from "@/hooks/useAuth";
import api from "@/lib/api";

function useDeviceStats() {
  return useQuery({
    queryKey: ["deviceStats"],
    queryFn: () => api.get("/devices/stats").then((r) => r.data),
    refetchInterval: 60_000,
  });
}

function useSyncStatus() {
  return useQuery({
    queryKey: ["syncStatus"],
    queryFn: () => api.get("/sync/status").then((r) => r.data),
    refetchInterval: 30_000,
  });
}

function StatCard({
  label,
  value,
  color,
  href,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-6 text-white flex flex-col gap-3 transition-opacity hover:opacity-90 ${color}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className="text-4xl font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-1 text-xs opacity-70">
        <span>View details</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function SyncStatusBar({ status, onSync, isSyncing }: { status: any; onSync: () => void; isSyncing: boolean }) {
  const lastSync = status?.last_sync_at ? new Date(status.last_sync_at) : null;
  const minutesAgo = lastSync
    ? Math.floor((Date.now() - lastSync.getTime()) / 60000)
    : null;

  const freshness =
    minutesAgo === null ? "Never synced"
    : minutesAgo < 2 ? "Synced just now"
    : minutesAgo < 60 ? `Synced ${minutesAgo}m ago`
    : `Synced ${Math.floor(minutesAgo / 60)}h ago`;

  const isStale = minutesAgo !== null && minutesAgo > 20;
  const hasError = !!status?.error;

  return (
    <div className={`flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl text-sm mb-6 ${
      hasError ? "bg-red-50 border border-red-200 text-red-700"
      : isStale || !lastSync ? "bg-amber-50 border border-amber-200 text-amber-700"
      : "bg-green-50 border border-green-200 text-green-700"
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        hasError ? "bg-red-500" : isStale || !lastSync ? "bg-amber-400" : "bg-green-500"
      }`} />
      <span className="font-medium">LabTech Sync</span>
      <span className="opacity-70">·</span>
      <span>{isSyncing ? "Syncing…" : hasError ? `Error: ${status.error}` : freshness}</span>
      {lastSync && !hasError && (
        <>
          <span className="opacity-70">·</span>
          <span className="opacity-60">{lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </>
      )}
      {status?.created > 0 && (
        <>
          <span className="opacity-70">·</span>
          <span className="opacity-80">+{status.created} new</span>
        </>
      )}
      <button
        onClick={onSync}
        disabled={isSyncing}
        className={`ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
          hasError || isStale || !lastSync
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isSyncing ? "Syncing…" : "Sync Now"}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: stats, isLoading: statsLoading } = useDeviceStats();
  const { data: syncStatus } = useSyncStatus();
  const queryClient = useQueryClient();
  const { mutate: triggerSync, isPending: isSyncing } = useMutation({
    mutationFn: () => api.post("/sync/labtech").then((r) => r.data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["syncStatus"] });
      queryClient.invalidateQueries({ queryKey: ["deviceStats"] });
    },
  });
  const [search, setSearch] = useState("");

  const filteredClients = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : [...clients].sort((a, b) => (b.device_count ?? 0) - (a.device_count ?? 0)).slice(0, 8);

  const loading = statsLoading;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.full_name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-gray-500 mt-1">MSP asset overview across all clients.</p>
      </div>

      <SyncStatusBar status={syncStatus} onSync={() => triggerSync()} isSyncing={isSyncing} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Devices"
          value={loading ? "—" : stats?.total ?? 0}
          color="bg-blue-600"
          href="/clients"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Assigned"
          value={loading ? "—" : stats?.assigned ?? 0}
          color="bg-indigo-500"
          href="/devices/status/assigned"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="In Repair"
          value={loading ? "—" : stats?.in_repair ?? 0}
          color="bg-amber-500"
          href="/devices/status/in_repair"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Disposed / Lost"
          value={loading ? "—" : (stats?.disposed ?? 0) + (stats?.lost ?? 0) + (stats?.stolen ?? 0)}
          color="bg-red-500"
          href="/devices/status/disposed"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Client search + list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 flex-shrink-0">Clients</h3>
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 flex-shrink-0 ml-auto">View all</Link>
        </div>

        {clientsLoading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No clients found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className="flex items-center gap-3 px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{client.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{client.available}</span>
                    <span className="hidden sm:inline bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{client.assigned}</span>
                    {(client.in_repair ?? 0) > 0 && (
                      <span className="hidden sm:inline bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{client.in_repair}</span>
                    )}
                    <span className="font-bold text-gray-600">{client.device_count}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

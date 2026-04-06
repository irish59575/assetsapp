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

function useStaleDevices() {
  return useQuery({
    queryKey: ["staleDevices"],
    queryFn: () => api.get("/devices?stale_days=60&limit=200").then((r) => r.data),
    staleTime: 60_000,
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
  label, value, color, onClick, icon,
}: {
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-6 text-white flex flex-col gap-3 transition-opacity hover:opacity-90 text-left w-full ${color}`}
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
    </button>
  );
}

function SyncStatusBar({ status, onSync, isSyncing }: { status: any; onSync: () => void; isSyncing: boolean }) {
  const rawTs = status?.last_sync_at;
  const lastSync = rawTs ? new Date(/[Zz+]/.test(rawTs) ? rawTs : rawTs + "Z") : null;
  const minutesAgo = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 60000) : null;
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
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasError ? "bg-red-500" : isStale || !lastSync ? "bg-amber-400" : "bg-green-500"}`} />
      <span className="font-medium">LabTech Sync</span>
      <span className="opacity-70">·</span>
      <span>{isSyncing ? "Syncing…" : hasError ? `Error: ${status.error}` : freshness}</span>
      {lastSync && !hasError && (
        <><span className="opacity-70">·</span>
        <span className="opacity-60">{lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></>
      )}
      {status?.created > 0 && (
        <><span className="opacity-70">·</span><span className="opacity-80">+{status.created} new</span></>
      )}
      <button
        onClick={onSync}
        disabled={isSyncing}
        className={`ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
          hasError || isStale || !lastSync ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-green-600 text-white hover:bg-green-700"
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
  const { data: staleDevices = [] } = useStaleDevices();
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
  const [showStale, setShowStale] = useState(false);

  const filteredClients = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : [...clients].sort((a, b) => (b.device_count ?? 0) - (a.device_count ?? 0)).slice(0, 8);

  const loading = statsLoading;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.full_name}` : ""}!
        </h2>
      </div>

      <SyncStatusBar status={syncStatus} onSync={() => triggerSync()} isSyncing={isSyncing} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Devices"
          value={loading ? "—" : stats?.total ?? 0}
          color="bg-blue-600"
          onClick={() => setShowStale(false)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Available"
          value={loading ? "—" : stats?.available ?? 0}
          color="bg-green-500"
          onClick={() => setShowStale(false)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="In Repair"
          value={loading ? "—" : stats?.in_repair ?? 0}
          color="bg-amber-500"
          onClick={() => setShowStale(false)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Not Seen 60+ Days"
          value={staleDevices.length}
          color={staleDevices.length > 0 ? "bg-red-500" : "bg-gray-400"}
          onClick={() => setShowStale(true)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Stale devices panel */}
      {showStale && (
        <div className="bg-white rounded-xl border border-red-200 mb-8">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Devices Not Seen in 60+ Days</h3>
              <p className="text-xs text-gray-500 mt-0.5">{staleDevices.length} device{staleDevices.length !== 1 ? "s" : ""} — excludes retired, disposed, for parts</p>
            </div>
            <button onClick={() => setShowStale(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Device</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Client</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Last Seen</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Last User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staleDevices.map((d: any) => {
                  const lastSeen = d.last_seen_at ? new Date(d.last_seen_at) : null;
                  const daysAgo = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 86400000) : null;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/devices/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {d.device_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{d.client_name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {d.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-red-600 font-medium">
                        {daysAgo !== null ? `${daysAgo} days ago` : "Never"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{d.last_logged_in_user ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client list */}
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

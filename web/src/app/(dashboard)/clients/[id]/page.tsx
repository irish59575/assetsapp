"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClient, useClientDevices } from "@/hooks/useClients";
import type { Device, DeviceStatus } from "@/types";

const STATUS_TABS: { label: string; value: string | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Available", value: "available" },
  { label: "Assigned", value: "assigned" },
  { label: "In Repair", value: "in_repair" },
  { label: "Retired", value: "retired" },
];

const STATUS_COLORS: Record<DeviceStatus, string> = {
  available: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  in_repair: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-600",
  disposed: "bg-red-100 text-red-700",
  for_parts: "bg-orange-100 text-orange-700",
  lost: "bg-purple-100 text-purple-700",
  stolen: "bg-red-200 text-red-900",
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Number(params.id);

  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: devices = [], isLoading: devicesLoading } = useClientDevices(
    clientId,
    activeStatus,
    debouncedSearch || undefined
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleExportCSV = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${base}/api/v1/devices/export?client_id=${clientId}`;
    const a = document.createElement("a");
    a.href = url;
    if (token) {
      // Append token as query param for direct download (browser doesn't support custom headers in anchor)
      a.href = `${url}&token=${token}`;
    }
    a.download = `client_${clientId}_devices.csv`;
    a.click();
  };

  if (clientLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Client not found.</p>
        <Link href="/clients" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-blue-600">Clients</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{client.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-gray-500 mt-1">
            {client.device_count} device{client.device_count !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by device name, serial, or assigned user..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Devices table */}
      {devicesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No devices found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Device</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Serial</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">OS</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">RAM</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Disk</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Label</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device) => (
                <DeviceRow key={device.id} device={device} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeviceRow({ device }: { device: Device }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/devices/${device.id}`} className="font-medium text-gray-900 hover:text-blue-600">
          {device.device_name}
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.serial_number ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.os_version ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {device.ram_gb != null ? `${device.ram_gb} GB` : "—"}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {device.disk_gb != null ? `${device.disk_gb} GB` : "—"}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.last_logged_in_user ?? "—"}</td>
      <td className="px-4 py-3 text-xs">
        {device.assigned_to
          ? <span className="text-blue-600 font-medium">{device.assigned_to}</span>
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {device.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        {device.qr_code ? (
          <span className="font-mono text-indigo-600 font-medium">{device.qr_code}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString() : "—"}
      </td>
    </tr>
  );
}

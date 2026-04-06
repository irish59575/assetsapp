"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useClient, useClientDevices } from "@/hooks/useClients";
import api from "@/lib/api";
import type { Device, DeviceStatus } from "@/types";

const STATUS_TABS: { label: string; value: string | undefined; activeClass: string }[] = [
  { label: "All",            value: undefined,          activeClass: "bg-blue-600 text-white" },
  { label: "Pre-Provision",  value: "pre_provisioning", activeClass: "bg-sky-500 text-white" },
  { label: "Available",      value: "available",        activeClass: "bg-green-500 text-white" },
  { label: "Assigned",  value: "assigned",  activeClass: "bg-blue-500 text-white" },
  { label: "In Repair", value: "in_repair", activeClass: "bg-yellow-400 text-yellow-900" },
  { label: "Retired",   value: "retired",   activeClass: "bg-gray-400 text-white" },
  { label: "Disposed",  value: "disposed",  activeClass: "bg-red-500 text-white" },
  { label: "For Parts", value: "for_parts", activeClass: "bg-orange-400 text-white" },
  { label: "Lost",      value: "lost",      activeClass: "bg-purple-500 text-white" },
  { label: "Stolen",    value: "stolen",    activeClass: "bg-red-700 text-white" },
];

const STATUS_COLORS: Record<DeviceStatus, string> = {
  pre_provisioning: "bg-sky-100 text-sky-800",
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

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ client_id: String(clientId) });
      if (activeStatus) params.set("status", activeStatus);
      const response = await api.get(`/devices/export?${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `client_${clientId}_devices.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    }
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
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-blue-600">Clients</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{client.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-gray-500 mt-1">
            {client.device_count} device{client.device_count !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <Link
          href={`/clients/${clientId}`}
          className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600"
        >
          Devices
        </Link>
        <Link
          href={`/clients/${clientId}/templates`}
          className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
        >
          Templates
        </Link>
        <Link
          href={`/clients/${clientId}/deployments`}
          className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
        >
          Deployments
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by device name, serial, or assigned user..."
          className="w-full md:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Status tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              activeStatus === tab.value
                ? tab.activeClass
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Devices — table on desktop, cards on mobile */}
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
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
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
          </>
      )}
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  return (
    <Link href={`/devices/${device.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{device.device_name}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600"}`}>
            {device.status.replace("_", " ")}
          </span>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5">
          {device.serial_number && <p>S/N: <span className="font-mono">{device.serial_number}</span></p>}
          {device.assigned_to && <p>Assigned: <span className="text-blue-600 font-medium">{device.assigned_to}</span></p>}
          {device.label_code && <p>Label: <span className="font-mono text-indigo-600">{device.label_code}</span></p>}
          {device.os_version && <p>{device.os_version}</p>}
        </div>
      </div>
    </Link>
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
        {device.label_code ? (
          <span className="font-mono text-indigo-600 font-medium">{device.label_code}</span>
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

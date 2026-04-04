"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDevices } from "@/hooks/useDevices";
import type { Device, DeviceStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "in_repair", label: "In Repair" },
  { value: "retired", label: "Retired" },
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

export default function DevicesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data: devices = [], isLoading } = useDevices({
    search: debouncedSearch || undefined,
    status: status || undefined,
    limit: 100,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Devices</h2>
          <p className="text-gray-500 mt-1">
            {devices.length} device{devices.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, serial, or user..."
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={handleSearchChange}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg">No devices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Device</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Serial</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Model</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
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
      <td className="px-4 py-3 text-gray-500">
        {device.client_name ? (
          <Link href={`/clients/${device.client_id}`} className="hover:text-blue-600">
            {device.client_name}
          </Link>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">{device.serial_number ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500">
        {[device.manufacturer, device.model].filter(Boolean).join(" ") || "—"}
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
      <td className="px-4 py-3 text-gray-500">{device.assigned_to ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString() : "—"}
      </td>
    </tr>
  );
}

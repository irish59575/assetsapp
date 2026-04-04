"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Device, DeviceStatus } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned Devices",
  in_repair: "Devices In Repair",
  disposed: "Disposed Devices",
  lost: "Lost Devices",
  stolen: "Stolen Devices",
  retired: "Retired Devices",
  for_parts: "For Parts",
  available: "Available Devices",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  in_repair: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-600",
  disposed: "bg-red-100 text-red-700",
  for_parts: "bg-orange-100 text-orange-700",
  lost: "bg-purple-100 text-purple-700",
  stolen: "bg-red-200 text-red-900",
};

export default function DevicesByStatusPage() {
  const { status } = useParams<{ status: string }>();
  const [search, setSearch] = useState("");

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices", "status", status],
    queryFn: () =>
      api.get<Device[]>("/devices", { params: { status, limit: 200 } }).then((r) => r.data),
    enabled: !!status,
  });

  const filtered = search.trim()
    ? devices.filter(
        (d) =>
          d.device_name.toLowerCase().includes(search.toLowerCase()) ||
          (d.serial_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (d.assigned_to ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (d.client_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : devices;

  const label = STATUS_LABELS[status] ?? `${status} Devices`;

  return (
    <div className="p-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{label}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
          <p className="text-gray-500 mt-1">{filtered.length} device{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <input
          type="text"
          placeholder="Search by name, serial, client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No devices found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Device</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Serial</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">OS</th>
                {status === "assigned" && (
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
                )}
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Seen</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/devices/${device.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {device.device_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {device.client_id ? (
                      <Link href={`/clients/${device.client_id}`} className="text-blue-600 hover:text-blue-700 text-xs">
                        {device.client_name ?? "—"}
                      </Link>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{device.serial_number ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{device.os_version ?? "—"}</td>
                  {status === "assigned" && (
                    <td className="px-4 py-3 text-blue-600 text-xs font-medium">{device.assigned_to ?? "—"}</td>
                  )}
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {device.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

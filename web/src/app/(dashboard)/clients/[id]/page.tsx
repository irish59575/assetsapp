"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClient, useClientDevices } from "@/hooks/useClients";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Device, DeviceStatus } from "@/types";

const STATUS_TABS: { label: string; value: string | undefined; activeClass: string }[] = [
  { label: "All",            value: undefined,          activeClass: "bg-blue-600 text-white" },
  { label: "Pre-Provision",  value: "pre_provisioning", activeClass: "bg-sky-500 text-white" },
  { label: "Available",      value: "available",        activeClass: "bg-green-500 text-white" },
  { label: "Assigned",       value: "assigned",         activeClass: "bg-blue-500 text-white" },
  { label: "In Repair",      value: "in_repair",        activeClass: "bg-yellow-400 text-yellow-900" },
  { label: "Retired",        value: "retired",          activeClass: "bg-gray-400 text-white" },
  { label: "Disposed",       value: "disposed",         activeClass: "bg-red-500 text-white" },
  { label: "For Parts",      value: "for_parts",        activeClass: "bg-orange-400 text-white" },
  { label: "Lost",           value: "lost",             activeClass: "bg-purple-500 text-white" },
  { label: "Stolen",         value: "stolen",           activeClass: "bg-red-700 text-white" },
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

const STATUS_BAR_COLORS: Record<string, string> = {
  pre_provisioning: "bg-sky-400",
  available: "bg-green-500",
  assigned: "bg-blue-500",
  in_repair: "bg-yellow-400",
  retired: "bg-gray-400",
  disposed: "bg-red-500",
  for_parts: "bg-orange-400",
  lost: "bg-purple-500",
  stolen: "bg-red-700",
};

type SectionTab = "overview" | "devices" | "templates" | "deployments";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Number(params.id);

  const [section, setSection] = useState<SectionTab>("overview");
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: devices = [], isLoading: devicesLoading } = useClientDevices(
    clientId,
    activeStatus,
    debouncedSearch || undefined
  );
  // All devices for overview stats (no filter)
  const { data: allDevices = [] } = useClientDevices(clientId, undefined, undefined);

  // Recent deployments for overview
  const { data: deployments = [] } = useQuery({
    queryKey: ["deployments", clientId],
    queryFn: () => api.get(`/deployments?client_id=${clientId}`).then(r => r.data),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleExportCSV = async () => {
    try {
      const p = new URLSearchParams({ client_id: String(clientId) });
      if (activeStatus) p.set("status", activeStatus);
      const response = await api.get(`/devices/export?${p}`, { responseType: "blob" });
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
        <Link href="/clients" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">Back to Clients</Link>
      </div>
    );
  }

  // Compute status breakdown from all devices
  const statusCounts: Record<string, number> = {};
  for (const d of allDevices) {
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
  }
  const total = allDevices.length;

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
          <p className="text-gray-500 mt-1">{client.device_count} device{client.device_count !== 1 ? "s" : ""}</p>
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
        {(["overview", "devices", "templates", "deployments"] as SectionTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSection(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
              section === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {section === "overview" && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total",     value: total,                           color: "text-gray-900", bg: "bg-white",      status: undefined },
              { label: "Assigned",  value: statusCounts["assigned"] ?? 0,   color: "text-blue-600", bg: "bg-blue-50",   status: "assigned" },
              { label: "Available", value: statusCounts["available"] ?? 0,  color: "text-green-600", bg: "bg-green-50", status: "available" },
              { label: "In Repair", value: statusCounts["in_repair"] ?? 0,  color: "text-yellow-600", bg: "bg-yellow-50", status: "in_repair" },
            ].map(({ label, value, color, bg, status }) => (
              <button
                key={label}
                onClick={() => { setSection("devices"); setActiveStatus(status); }}
                className={`${bg} rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-gray-300 transition-all`}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </button>
            ))}
          </div>

          {/* Status breakdown bar */}
          {total > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Device Status Breakdown</h3>
              <div className="flex h-4 rounded-full overflow-hidden gap-px mb-4">
                {Object.entries(statusCounts)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div
                      key={status}
                      className={`${STATUS_BAR_COLORS[status] ?? "bg-gray-400"} transition-all`}
                      style={{ width: `${(count / total) * 100}%` }}
                      title={`${status.replace("_", " ")}: ${count}`}
                    />
                  ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(statusCounts)
                  .filter(([, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => { setSection("devices"); setActiveStatus(status); }}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_BAR_COLORS[status] ?? "bg-gray-400"}`} />
                      <span className="capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                      <span className="text-gray-400">({Math.round((count / total) * 100)}%)</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Recent deployments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Recent Deployments</h3>
              <button onClick={() => setSection("deployments")} className="text-xs text-blue-600 hover:underline">View all</button>
            </div>
            {deployments.length === 0 ? (
              <p className="text-sm text-gray-400">No deployments yet.</p>
            ) : (
              <div className="space-y-2">
                {deployments.slice(0, 5).map((d: any) => (
                  <Link key={d.id} href={`/deployments/${d.id}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.template_name ?? "Deployment"}</p>
                      <p className="text-xs text-gray-400">{d.device_name ?? ""} · {new Date(d.started_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      d.status === "completed" ? "bg-green-100 text-green-700"
                      : d.status === "in_progress" ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                      {d.status?.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* In repair alert */}
          {(statusCounts["in_repair"] ?? 0) > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-medium text-yellow-800">
                  {statusCounts["in_repair"]} device{statusCounts["in_repair"] !== 1 ? "s" : ""} currently in repair
                </p>
              </div>
              <button
                onClick={() => { setSection("devices"); setActiveStatus("in_repair"); }}
                className="text-xs font-semibold text-yellow-700 hover:underline flex-shrink-0"
              >
                View
              </button>
            </div>
          )}

          {/* Lost/Stolen alert */}
          {((statusCounts["lost"] ?? 0) + (statusCounts["stolen"] ?? 0)) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">
                  {(statusCounts["lost"] ?? 0) + (statusCounts["stolen"] ?? 0)} device{((statusCounts["lost"] ?? 0) + (statusCounts["stolen"] ?? 0)) !== 1 ? "s" : ""} marked lost or stolen
                </p>
              </div>
              <button
                onClick={() => { setSection("devices"); setActiveStatus("lost"); }}
                className="text-xs font-semibold text-red-700 hover:underline flex-shrink-0"
              >
                View
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Devices ── */}
      {section === "devices" && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by device name, serial, or assigned user..."
              className="w-full md:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveStatus(tab.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                  activeStatus === tab.value ? tab.activeClass : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {devicesLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400">No devices found.</p></div>
          ) : (
            <>
              <div className="md:hidden space-y-2">{devices.map(d => <DeviceCard key={d.id} device={d} />)}</div>
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
                  <tbody className="divide-y divide-gray-100">{devices.map(d => <DeviceRow key={d.id} device={d} />)}</tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Templates ── */}
      {section === "templates" && (
        <TemplatesTab clientId={clientId} />
      )}

      {/* ── Deployments ── */}
      {section === "deployments" && (
        <DeploymentsTab clientId={clientId} />
      )}
    </div>
  );
}

function TemplatesTab({ clientId }: { clientId: number }) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", clientId],
    queryFn: () => api.get(`/checklists/templates?client_id=${clientId}`).then(r => r.data),
  });
  return isLoading ? (
    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
  ) : templates.length === 0 ? (
    <div className="text-center py-12"><p className="text-gray-400">No templates yet.</p></div>
  ) : (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {templates.map((t: any) => (
        <div key={t.id} className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-gray-900 text-sm">{t.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.steps?.length ?? 0} steps</p>
          </div>
          <Link href={`/clients/${clientId}/templates`} className="text-xs text-blue-600 hover:underline">View</Link>
        </div>
      ))}
    </div>
  );
}

function DeploymentsTab({ clientId }: { clientId: number }) {
  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ["deployments", clientId],
    queryFn: () => api.get(`/deployments?client_id=${clientId}`).then(r => r.data),
  });
  return isLoading ? (
    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
  ) : deployments.length === 0 ? (
    <div className="text-center py-12"><p className="text-gray-400">No deployments yet.</p></div>
  ) : (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {deployments.map((d: any) => (
        <Link key={d.id} href={`/deployments/${d.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div>
            <p className="font-medium text-gray-900 text-sm">{d.template_name ?? "Deployment"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{d.device_name ?? ""} · {new Date(d.started_at).toLocaleDateString()}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
            d.status === "completed" ? "bg-green-100 text-green-700"
            : d.status === "in_progress" ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-500"
          }`}>
            {d.status?.replace("_", " ")}
          </span>
        </Link>
      ))}
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
        <Link href={`/devices/${device.id}`} className="font-medium text-gray-900 hover:text-blue-600">{device.device_name}</Link>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.serial_number ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.os_version ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.ram_gb != null ? `${device.ram_gb} GB` : "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.disk_gb != null ? `${device.disk_gb} GB` : "—"}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{device.last_logged_in_user ?? "—"}</td>
      <td className="px-4 py-3 text-xs">
        {device.assigned_to ? <span className="text-blue-600 font-medium">{device.assigned_to}</span> : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600"}`}>
          {device.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        {device.label_code ? <span className="font-mono text-indigo-600 font-medium">{device.label_code}</span> : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString() : "—"}
      </td>
    </tr>
  );
}

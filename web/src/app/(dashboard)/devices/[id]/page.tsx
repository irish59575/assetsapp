"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDevice, useDeviceHistory, useUnassignDevice, useSetDeviceStatus } from "@/hooks/useDevices";
import { AssignModal } from "@/components/AssignModal";
import { CheckinModal, CheckoutModal } from "@/components/RepairModal";
import type { DeviceStatus } from "@/types";

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

const TERMINAL_STATUSES: { value: DeviceStatus; label: string; icon: string; color: string }[] = [
  { value: "retired",   label: "Retired",   icon: "🗄️", color: "text-gray-600" },
  { value: "disposed",  label: "Disposed",  icon: "🗑️", color: "text-red-600" },
  { value: "for_parts", label: "For Parts", icon: "🔧", color: "text-orange-600" },
  { value: "lost",      label: "Lost",      icon: "❓", color: "text-purple-600" },
  { value: "stolen",    label: "Stolen",    icon: "🚨", color: "text-red-800" },
];

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = Number(params.id);

  const { data: device, isLoading } = useDevice(deviceId);
  const { data: history } = useDeviceHistory(deviceId);
  const { mutate: unassign, isPending: isUnassigning } = useUnassignDevice();
  const { mutate: setStatus, isPending: isSettingStatus } = useSetDeviceStatus();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ value: DeviceStatus; label: string } | null>(null);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

  const handleUnassign = () => setShowUnassignConfirm(true);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Device not found.</p>
        <Link href="/devices" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Back to Devices
        </Link>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[device.status] ?? "bg-gray-100 text-gray-600";

  const hwFields = [
    { label: "Serial Number", value: device.serial_number },
    { label: "Manufacturer", value: device.manufacturer },
    { label: "Model", value: device.model },
    { label: "OS Version", value: device.os_version },
    { label: "IP Address", value: device.ip_address },
    { label: "RAM", value: device.ram_gb ? `${device.ram_gb} GB` : null },
    { label: "Disk", value: device.disk_gb ? `${device.disk_gb} GB` : null },
    { label: "Last User", value: device.last_logged_in_user },
    {
      label: "Last Seen",
      value: device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : null,
    },
    { label: "LabTech ID", value: device.labtech_id },
  ].filter((f) => f.value);

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        {device.client_id ? (
          <>
            <Link href="/clients" className="hover:text-blue-600">Clients</Link>
            <span className="mx-2">/</span>
            <Link href={`/clients/${device.client_id}`} className="hover:text-blue-600">
              {device.client_name}
            </Link>
            <span className="mx-2">/</span>
          </>
        ) : (
          <>
            <Link href="/devices" className="hover:text-blue-600">Devices</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{device.device_name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{device.device_name}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColor}`}>
              {device.status.replace("_", " ")}
            </span>
          </div>
          {device.client_name && (
            <p className="text-gray-500 text-sm">{device.client_name}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {(device.status === "available" || device.status === "assigned") && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Assign to User
            </button>
          )}
          {device.status === "assigned" && (
            <button
              onClick={handleUnassign}
              disabled={isUnassigning}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60 transition-colors"
            >
              {isUnassigning ? "Unassigning..." : "Unassign"}
            </button>
          )}
          {(device.status === "available" || device.status === "assigned") && (
            <button
              onClick={() => setShowCheckinModal(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Check In for Repair
            </button>
          )}
          {device.status === "in_repair" && (
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Check Out (Repair Complete)
            </button>
          )}
          {/* Mark As dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              disabled={isSettingStatus}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              Mark As
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {device.status !== "available" && (
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2 font-medium"
                    onClick={() => { setStatus({ id: deviceId, status: "available" }); setShowStatusMenu(false); }}
                  >
                    <span>✅</span> Available
                  </button>
                )}
                <div className="border-t border-gray-100" />
                {TERMINAL_STATUSES.filter(s => s.value !== device.status).map(s => (
                  <button
                    key={s.value}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${s.color}`}
                    onClick={() => { setPendingStatus(s); setShowStatusMenu(false); }}
                  >
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Hardware Details</h3>
          <dl className="space-y-3">
            {hwFields.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900 text-right max-w-xs truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Assignment / Repair status */}
        <div className="space-y-4">
          {device.label_code && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">QR Label</h3>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-semibold text-gray-900 tracking-wide">
                  {device.label_code}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  linked
                </span>
              </div>
            </div>
          )}

          {device.status === "assigned" && device.assigned_to && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Current Assignment</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-blue-600">Assigned to</dt>
                  <dd className="font-medium text-blue-900">{device.assigned_to}</dd>
                </div>
                {device.assigned_by && (
                  <div className="flex justify-between">
                    <dt className="text-blue-600">Assigned by</dt>
                    <dd className="font-medium text-blue-900">{device.assigned_by}</dd>
                  </div>
                )}
                {device.assigned_at && (
                  <div className="flex justify-between">
                    <dt className="text-blue-600">Since</dt>
                    <dd className="font-medium text-blue-900">
                      {new Date(device.assigned_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {device.status === "in_repair" && history?.repair_logs[0] && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
              <h3 className="text-sm font-semibold text-yellow-800 mb-3">Current Repair</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-yellow-700">Checked in by</dt>
                  <dd className="font-medium text-yellow-900">
                    {history.repair_logs[0].checked_in_by}
                  </dd>
                </div>
                <div>
                  <dt className="text-yellow-700 mb-1">Issue</dt>
                  <dd className="font-medium text-yellow-900">
                    {history.repair_logs[0].issue_description}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {device.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{device.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* History — combined chronological */}
      {history && (history.assignments.length > 0 || history.repair_logs.length > 0 || (history.status_logs ?? []).length > 0) && (() => {
        type HistoryItem =
          | { kind: "assignment"; date: Date; id: number; a: typeof history.assignments[0] }
          | { kind: "repair"; date: Date; id: number; r: typeof history.repair_logs[0] }
          | { kind: "status"; date: Date; id: number; s: NonNullable<typeof history.status_logs>[0] };

        const items: HistoryItem[] = [
          ...history.assignments.map((a) => ({
            kind: "assignment" as const,
            date: new Date(a.assigned_at),
            id: a.id,
            a,
          })),
          ...history.repair_logs.map((r) => ({
            kind: "repair" as const,
            date: new Date(r.checked_in_at),
            id: r.id,
            r,
          })),
          ...(history.status_logs ?? []).map((s) => ({
            kind: "status" as const,
            date: new Date(s.changed_at),
            id: s.id,
            s,
          })),
        ].sort((x, y) => y.date.getTime() - x.date.getTime());

        return (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              History
              <span className="ml-2 text-xs font-normal text-gray-400">{items.length} event{items.length !== 1 ? "s" : ""}</span>
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-4">
                {items.map((item) => {
                  if (item.kind === "assignment") {
                    const a = item.a;
                    return (
                      <div key={`a-${a.id}`} className="flex items-start gap-3 text-sm pl-1">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              Assignment
                            </span>
                            <span className="text-gray-400 text-xs">{item.date.toLocaleDateString()}{a.returned_at ? ` → ${new Date(a.returned_at).toLocaleDateString()}` : " (active)"}</span>
                          </div>
                          <p className="text-gray-900 font-medium mt-0.5">
                            {a.assigned_to} — by {a.assigned_by}
                          </p>
                          {a.notes && <p className="text-gray-500 text-xs mt-0.5">{a.notes}</p>}
                        </div>
                      </div>
                    );
                  } else if (item.kind === "repair") {
                    const r = item.r;
                    return (
                      <div key={`r-${r.id}`} className="flex items-start gap-3 text-sm pl-1">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-100 border-2 border-amber-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                              Repair
                            </span>
                            <span className="text-gray-400 text-xs">{item.date.toLocaleDateString()}{r.checked_out_at ? ` → ${new Date(r.checked_out_at).toLocaleDateString()}` : " (open)"}</span>
                          </div>
                          <p className="text-gray-900 font-medium mt-0.5">{r.issue_description}</p>
                          {r.resolution_notes && (
                            <p className="text-gray-500 text-xs mt-0.5">Resolution: {r.resolution_notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    const s = item.s;
                    const label = s.status.replace(/_/g, " ");
                    const statusBadge = STATUS_COLORS[s.status as DeviceStatus] ?? "bg-gray-100 text-gray-600";
                    const [bgClass] = statusBadge.split(" ");
                    const dotBorder = bgClass.replace("bg-", "border-").replace("-100", "-300").replace("-200", "-400");
                    return (
                      <div key={`s-${s.id}`} className="flex items-start gap-3 text-sm pl-1">
                        <div className={`mt-0.5 w-5 h-5 rounded-full ${bgClass} border-2 ${dotBorder} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge}`}>
                              {label}
                            </span>
                            <span className="text-gray-400 text-xs">{item.date.toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-700 font-medium mt-0.5">
                            Marked as <span className="font-semibold capitalize">{label}</span>
                            {s.changed_by ? ` by ${s.changed_by}` : ""}
                          </p>
                          {s.notes && <p className="text-gray-500 text-xs mt-0.5">{s.notes}</p>}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {showAssignModal && (
        <AssignModal deviceId={deviceId} deviceName={device.device_name} onClose={() => setShowAssignModal(false)} />
      )}
      {showCheckinModal && (
        <CheckinModal deviceId={deviceId} deviceName={device.device_name} onClose={() => setShowCheckinModal(false)} />
      )}
      {showCheckoutModal && (
        <CheckoutModal deviceId={deviceId} deviceName={device.device_name} onClose={() => setShowCheckoutModal(false)} />
      )}
      {showUnassignConfirm && (
        <ConfirmModal
          title="Remove Assignment"
          message={`Remove the current assignment from ${device.device_name}?`}
          confirmLabel="Unassign"
          danger
          onConfirm={() => { unassign(deviceId); setShowUnassignConfirm(false); }}
          onCancel={() => setShowUnassignConfirm(false)}
        />
      )}
      {pendingStatus && (
        <ConfirmModal
          title={`Mark as ${pendingStatus.label}`}
          message={`Are you sure you want to mark ${device.device_name} as "${pendingStatus.label}"? This will clear any active assignment.`}
          confirmLabel={`Mark as ${pendingStatus.label}`}
          danger={["disposed", "stolen", "lost"].includes(pendingStatus.value)}
          onConfirm={() => { setStatus({ id: deviceId, status: pendingStatus.value }); setPendingStatus(null); }}
          onCancel={() => setPendingStatus(null)}
        />
      )}
    </div>
  );
}

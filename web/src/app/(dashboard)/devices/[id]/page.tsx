"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDevice, useDeviceHistory, useUnassignDevice } from "@/hooks/useDevices";
import { AssignModal } from "@/components/AssignModal";
import { CheckinModal, CheckoutModal } from "@/components/RepairModal";
import type { DeviceStatus } from "@/types";

const STATUS_COLORS: Record<DeviceStatus, string> = {
  available: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  in_repair: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-600",
};

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = Number(params.id);

  const { data: device, isLoading } = useDevice(deviceId);
  const { data: history } = useDeviceHistory(deviceId);
  const { mutate: unassign, isPending: isUnassigning } = useUnassignDevice();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleUnassign = () => {
    if (!confirm("Remove the current assignment from this device?")) return;
    unassign(deviceId);
  };

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
        <div className="flex gap-2 flex-wrap justify-end">
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
              className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-50 transition-colors"
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

      {/* History */}
      {history && (history.assignments.length > 0 || history.repair_logs.length > 0) && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">History</h3>
          <div className="space-y-3">
            {history.assignments.map((a) => (
              <div key={`a-${a.id}`} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  Assignment
                </span>
                <div>
                  <p className="text-gray-900 font-medium">
                    {a.assigned_to} — by {a.assigned_by}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(a.assigned_at).toLocaleDateString()}
                    {a.returned_at
                      ? ` → ${new Date(a.returned_at).toLocaleDateString()}`
                      : " (active)"}
                  </p>
                  {a.notes && <p className="text-gray-500 text-xs mt-0.5">{a.notes}</p>}
                </div>
              </div>
            ))}
            {history.repair_logs.map((r) => (
              <div key={`r-${r.id}`} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                  Repair
                </span>
                <div>
                  <p className="text-gray-900 font-medium">{r.issue_description}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(r.checked_in_at).toLocaleDateString()}
                    {r.checked_out_at
                      ? ` → ${new Date(r.checked_out_at).toLocaleDateString()}`
                      : " (open)"}
                  </p>
                  {r.resolution_notes && (
                    <p className="text-gray-500 text-xs mt-0.5">Resolution: {r.resolution_notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAssignModal && (
        <AssignModal
          deviceId={deviceId}
          deviceName={device.device_name}
          onClose={() => setShowAssignModal(false)}
        />
      )}
      {showCheckinModal && (
        <CheckinModal
          deviceId={deviceId}
          deviceName={device.device_name}
          onClose={() => setShowCheckinModal(false)}
        />
      )}
      {showCheckoutModal && (
        <CheckoutModal
          deviceId={deviceId}
          deviceName={device.device_name}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}
    </div>
  );
}

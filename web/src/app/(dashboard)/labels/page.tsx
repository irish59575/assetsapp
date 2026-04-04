"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLabels, useGenerateLabels, useUnassignLabel } from "@/hooks/useLabels";
import type { QRLabel, LabelStatus } from "@/types";

const STATUS_TABS: { label: string; value: string | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Unassigned", value: "unassigned" },
  { label: "Assigned", value: "assigned" },
  { label: "Retired", value: "retired" },
];

const STATUS_COLORS: Record<LabelStatus, string> = {
  unassigned: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-100 text-blue-800",
  retired: "bg-red-100 text-red-600",
};

export default function LabelsPage() {
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState("50");
  const [generatePrefix, setGeneratePrefix] = useState("ASST");
  const [generateError, setGenerateError] = useState("");

  const { data: labels = [], isLoading } = useLabels({ status: activeStatus, limit: 500 });
  const generateMutation = useGenerateLabels();
  const unassignMutation = useUnassignLabel();

  const total = labels.length;
  const stats = {
    unassigned: labels.filter((l) => l.status === "unassigned").length,
    assigned: labels.filter((l) => l.status === "assigned").length,
    retired: labels.filter((l) => l.status === "retired").length,
  };

  const handleGenerate = () => {
    const count = parseInt(generateCount, 10);
    if (isNaN(count) || count < 1 || count > 1000) {
      setGenerateError("Count must be between 1 and 1000.");
      return;
    }
    if (!generatePrefix.trim()) {
      setGenerateError("Prefix is required.");
      return;
    }
    setGenerateError("");
    generateMutation.mutate(
      { count, prefix: generatePrefix.trim().toUpperCase() },
      {
        onSuccess: () => setShowGenerateModal(false),
        onError: (e: unknown) => setGenerateError((e as Error).message),
      }
    );
  };

  const handleUnassign = (labelCode: string) => {
    if (!confirm(`Remove assignment for label ${labelCode}?`)) return;
    unassignMutation.mutate(labelCode);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Labels</h2>
          <p className="text-gray-500 mt-1">
            {total} label{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/labels/print"
            className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Sheet
          </Link>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Labels
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Unassigned</p>
          <p className="text-2xl font-bold text-gray-700">{stats.unassigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Assigned</p>
          <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">Retired</p>
          <p className="text-2xl font-bold text-red-500">{stats.retired}</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
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

      {/* Labels table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No labels found. Generate a label pool to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Label Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Device</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned By</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned At</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labels.map((label) => (
                <LabelRow key={label.id} label={label} onUnassign={handleUnassign} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Labels</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={generatePrefix}
                  onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())}
                  placeholder="ASST"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Count (1–1000)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                />
              </div>
              {generateError && (
                <p className="text-sm text-red-600">{generateError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowGenerateModal(false); setGenerateError(""); }}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {generateMutation.isPending ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelRow({
  label,
  onUnassign,
}: {
  label: QRLabel;
  onUnassign: (code: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-semibold text-indigo-700">{label.label_code}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_COLORS[label.status]
          }`}
        >
          {label.status}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-700">
        {label.device ? (
          <Link href={`/devices/${label.device.id}`} className="hover:text-blue-600">
            {label.device.device_name}
          </Link>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{label.assigned_by ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {label.assigned_at ? new Date(label.assigned_at).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        {label.status === "assigned" && (
          <button
            onClick={() => onUnassign(label.label_code)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Unassign
          </button>
        )}
      </td>
    </tr>
  );
}

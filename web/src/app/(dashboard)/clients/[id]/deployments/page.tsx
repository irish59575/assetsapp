"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useClient } from "@/hooks/useClients";
import { useTemplates } from "@/hooks/useChecklists";
import { useDeployments, useCreateDeployment, useDeleteDeployment } from "@/hooks/useDeployments";
import type { Deployment, DeploymentStatus } from "@/types";

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  in_progress: "In Progress",
  complete: "Complete",
  cancelled: "Cancelled",
};

function progress(d: Deployment) {
  const total = d.steps.length;
  if (!total) return 0;
  const done = d.steps.filter((s) => s.status === "done" || s.status === "skipped" || s.status === "na").length;
  return Math.round((done / total) * 100);
}

export default function DeploymentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = Number(params.id);

  const { data: client } = useClient(clientId);
  const { data: templates = [] } = useTemplates(clientId);
  const { data: deployments = [], isLoading } = useDeployments(clientId);
  const { mutate: createDeployment, isPending: isCreating } = useCreateDeployment();
  const { mutate: deleteDeployment } = useDeleteDeployment(clientId);

  // Auto-open "start" modal if ?start=<templateId> is in URL
  const startTemplateId = searchParams.get("start");
  const [showStart, setShowStart] = useState(!!startTemplateId);
  const [selectedTemplate, setSelectedTemplate] = useState(startTemplateId ?? "");
  const [engineerName, setEngineerName] = useState("");
  const [cwTicket, setCwTicket] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (startTemplateId) {
      setSelectedTemplate(startTemplateId);
      setShowStart(true);
    }
  }, [startTemplateId]);

  const handleStart = () => {
    if (!selectedTemplate || !engineerName.trim()) return;
    createDeployment(
      {
        template_id: Number(selectedTemplate),
        client_id: clientId,
        engineer_name: engineerName.trim(),
        connectwise_ticket: cwTicket.trim() || undefined,
      },
      {
        onSuccess: (deployment) => {
          router.push(`/deployments/${deployment.id}`);
        },
      }
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-blue-600">Clients</Link>
        <span className="mx-2">/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-blue-600">{client?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Deployments</span>
      </nav>

      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{client?.name}</h2>
          <p className="text-gray-500 mt-1">Deployments</p>
        </div>
        <button
          onClick={() => setShowStart(true)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0"
        >
          + Start
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <Link href={`/clients/${clientId}`} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
          Devices
        </Link>
        <Link href={`/clients/${clientId}/templates`} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
          Templates
        </Link>
        <Link href={`/clients/${clientId}/deployments`} className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
          Deployments
        </Link>
      </div>

      {/* Start deployment modal */}
      {showStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Start New Deployment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No templates yet.{" "}
                    <Link href={`/clients/${clientId}/templates`} className="underline">Create one first.</Link>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineer Name</label>
                <input
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ConnectWise Ticket # (optional)</label>
                <input
                  value={cwTicket}
                  onChange={(e) => setCwTicket(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 123456"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStart(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={!selectedTemplate || !engineerName.trim() || isCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isCreating ? "Starting…" : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No deployments yet</p>
          <p className="text-sm">Start a deployment from a template above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map((d) => {
            const pct = progress(d);
            return (
              <div key={d.id} className="relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                <Link href={`/deployments/${d.id}`} className="block p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{d.template_name}</p>
                      <p className="text-sm text-gray-500">
                        {d.engineer_name} · {new Date(d.started_at).toLocaleDateString()}
                        {d.device_name && <span className="ml-2 text-gray-400">· {d.device_name}</span>}
                        {d.serial_number && <span className="ml-1 text-gray-400">({d.serial_number})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pr-8">
                      {d.connectwise_ticket && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          #{d.connectwise_ticket}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </div>
                  </div>
                  {d.status === "in_progress" && d.steps.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{d.steps.filter(s => s.status !== "pending").length} / {d.steps.length} steps</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => setPendingDelete({ id: d.id, name: d.template_name ?? "this deployment" })}
                  className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete deployment"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete Deployment"
          message={`Are you sure you want to delete the "${pendingDelete.name}" deployment? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { deleteDeployment(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

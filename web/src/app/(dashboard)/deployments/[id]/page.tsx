"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  useDeployment,
  useUpdateDeployment,
  useUpdateDeploymentStep,
  useCompleteDeployment,
  useCancelDeployment,
} from "@/hooks/useDeployments";
import type { DeploymentStep, DeploymentStepStatus } from "@/types";

function CwSendButton({ deploymentId, ticketNumber }: { deploymentId: number; ticketNumber: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const send = async () => {
    setState("sending");
    try {
      await api.post(`/deployments/${deploymentId}/send-to-connectwise`);
      setState("sent");
      setTimeout(() => setState("idle"), 4000);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? "Failed to send");
      setState("error");
      setTimeout(() => setState("idle"), 5000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={send}
        disabled={state === "sending"}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
          state === "sent" ? "bg-green-100 text-green-700 border border-green-200"
          : state === "error" ? "bg-red-100 text-red-700 border border-red-200"
          : "border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
        title={`Send PDF to ConnectWise Ticket #${ticketNumber}`}
      >
        {state === "sending" ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : state === "sent" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent!" : state === "error" ? "Failed" : `Send to CW #${ticketNumber}`}
      </button>
      {state === "error" && errorMsg && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 z-10">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

const STEP_STATUS_CONFIG: Record<DeploymentStepStatus, { label: string; color: string; dot: string }> = {
  pending:  { label: "Pending",  color: "bg-gray-100 text-gray-500",   dot: "bg-gray-300" },
  done:     { label: "Done",     color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  skipped:  { label: "Skipped",  color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  na:       { label: "N/A",      color: "bg-gray-100 text-gray-400",   dot: "bg-gray-200" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/** Parse a description into sub-items (lines starting with •) and plain text lines */
function parseDescription(desc: string | null): { type: "bullet" | "text"; text: string }[] {
  if (!desc) return [];
  return desc
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      type: (line.startsWith("•") ? "bullet" : "text") as "bullet" | "text",
      text: line.startsWith("•") ? line.slice(1).trim() : line,
    }));
}

function SubChecklist({ description }: { description: string | null }) {
  const items = parseDescription(description);
  const bullets = items.filter((i) => i.type === "bullet");
  const texts = items.filter((i) => i.type === "text");
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      {texts.map((item, i) => (
        <p key={`t${i}`} className="text-sm text-gray-600 mb-2">{item.text}</p>
      ))}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <button
                onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  checked[i]
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-green-400"
                }`}
              >
                {checked[i] && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`text-sm leading-snug ${checked[i] ? "line-through text-gray-400" : "text-gray-700"}`}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepRow({
  step,
  deploymentId,
  engineer,
  onUpdate,
}: {
  step: DeploymentStep;
  deploymentId: number;
  engineer: string;
  onUpdate: (stepId: number, status: DeploymentStepStatus, notes: string) => void;
}) {
  const [notes, setNotes] = useState(step.notes ?? "");
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const cfg = STEP_STATUS_CONFIG[step.status];

  const { mutate: uploadPhoto, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post(`/deployments/${deploymentId}/steps/${step.id}/photos`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments", "detail", deploymentId] }),
  });

  const { mutate: deletePhoto } = useMutation({
    mutationFn: (photoId: number) =>
      api.delete(`/deployments/${deploymentId}/steps/${step.id}/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments", "detail", deploymentId] }),
  });

  return (
    <div className={`rounded-xl border transition-all ${step.status === "done" ? "border-green-200 bg-green-50" : step.status === "skipped" ? "border-yellow-100 bg-yellow-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Status dot */}
        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${cfg.dot}`} />

        {/* Step number + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{step.order + 1}</span>
            <p className={`font-medium text-sm ${step.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
              {step.title}
            </p>
            {!step.required && <span className="text-xs text-gray-400">(optional)</span>}
          </div>
          {step.notes && !expanded && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{step.notes}</p>
          )}
        </div>

        {/* Status badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>

        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
          <SubChecklist description={step.description} />
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Comments</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Add notes about this step…"
            />
          </div>

          {/* Photos */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Photos</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isUploading ? "Uploading…" : "Add Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </div>
            {step.photos && step.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={`${API_BASE}/uploads/step_photos/${photo.filename}`}
                      alt="Step photo"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onUpdate(step.id, "done", notes)}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              ✓ Mark Done
            </button>
            <button
              onClick={() => onUpdate(step.id, "skipped", notes)}
              className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => onUpdate(step.id, "na", notes)}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              N/A
            </button>
            {step.status !== "pending" && (
              <button
                onClick={() => onUpdate(step.id, "pending", notes)}
                className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          {step.completed_at && (
            <p className="text-xs text-gray-400 mt-2">
              {step.status === "done" ? "Completed" : "Updated"} {new Date(step.completed_at).toLocaleString()}
              {step.completed_by && ` by ${step.completed_by}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeploymentPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentId = Number(params.id);

  const { data: deployment, isLoading } = useDeployment(deploymentId);
  const { mutate: updateDeployment } = useUpdateDeployment(deploymentId);
  const { mutate: updateStep } = useUpdateDeploymentStep(deploymentId);
  const { mutate: complete, isPending: isCompleting } = useCompleteDeployment();
  const { mutate: cancel } = useCancelDeployment();

  const [editingDevice, setEditingDevice] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!deployment) {
    return <div className="p-4 md:p-8 text-gray-500">Deployment not found.</div>;
  }

  const totalSteps = deployment.steps.length;
  const doneSteps = deployment.steps.filter(
    (s) => s.status === "done" || s.status === "skipped" || s.status === "na"
  ).length;
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const allDone = doneSteps === totalSteps && totalSteps > 0;
  const requiredPending = deployment.steps.filter(
    (s) => s.required && s.status === "pending"
  ).length;

  const handleStepUpdate = (stepId: number, status: DeploymentStepStatus, notes: string) => {
    updateStep({ stepId, body: { status, notes, completed_by: deployment.engineer_name } });
  };

  const handleLinkDevice = () => {
    updateDeployment(
      { serial_number: serialInput, device_name: deviceNameInput, label_code: labelInput || undefined },
      { onSuccess: () => { setEditingDevice(false); } }
    );
  };

  const isComplete = deployment.status === "complete";
  const isCancelled = deployment.status === "cancelled";
  const isActive = deployment.status === "in_progress";

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-xs md:text-sm text-gray-500 mb-4 flex flex-wrap items-center gap-x-1 gap-y-0.5">
        <Link href="/clients" className="hover:text-blue-600">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${deployment.client_id}`} className="hover:text-blue-600 truncate max-w-[100px]">{deployment.client_name}</Link>
        <span>/</span>
        <Link href={`/clients/${deployment.client_id}/deployments`} className="hover:text-blue-600">Deployments</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{deployment.template_name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{deployment.template_name}</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              isComplete ? "bg-green-100 text-green-700"
              : isCancelled ? "bg-gray-100 text-gray-500"
              : "bg-blue-100 text-blue-700"
            }`}>
              {isComplete ? "Complete" : isCancelled ? "Cancelled" : "In Progress"}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {deployment.connectwise_ticket && (
              <CwSendButton deploymentId={deploymentId} ticketNumber={deployment.connectwise_ticket} />
            )}
            <Link
              href={`/deployments/${deploymentId}/print`}
              target="_blank"
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print / PDF</span>
            </Link>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          {deployment.client_name} · {deployment.engineer_name} · Started {new Date(deployment.started_at).toLocaleDateString()}
        </p>
      </div>

      {/* Progress bar */}
      {isActive && totalSteps > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{doneSteps} of {totalSteps} steps complete</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {requiredPending > 0 && (
            <p className="text-xs text-amber-600 mt-1">{requiredPending} required step{requiredPending !== 1 ? "s" : ""} still pending</p>
          )}
        </div>
      )}

      {/* Device / QR label info card */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Device Info</h3>
          <button
            onClick={() => {
              setSerialInput(deployment.serial_number ?? "");
              setDeviceNameInput(deployment.device_name ?? "");
              setLabelInput(deployment.label_code ?? "");
              setEditingDevice((v) => !v);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {editingDevice ? "Cancel" : deployment.device_name || deployment.serial_number ? "Edit" : "Link Device"}
          </button>
        </div>

        {editingDevice ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Device Name</label>
              <input
                value={deviceNameInput}
                onChange={(e) => setDeviceNameInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. HEE-LAPTOP-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
              <input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 5CD12345AB"
              />
              <p className="text-xs text-gray-400 mt-1">
                This will create a pre-provisioned device record. When LabTech syncs this serial, it will link automatically.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR Label Code</label>
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. PRES-00042"
              />
            </div>
            <button
              onClick={handleLinkDevice}
              disabled={!serialInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Device Info
            </button>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500 text-xs">Device Name</dt>
              <dd className="font-medium text-gray-900">{deployment.device_name || <span className="text-gray-400">Not set</span>}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Serial Number</dt>
              <dd className="font-mono font-medium text-gray-900">{deployment.serial_number || <span className="text-gray-400">Not set</span>}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">QR Label</dt>
              <dd className="font-mono font-medium text-gray-900">{deployment.label_code || <span className="text-gray-400">Not assigned</span>}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">ConnectWise Ticket</dt>
              <dd className="font-medium text-gray-900">{deployment.connectwise_ticket ? `#${deployment.connectwise_ticket}` : <span className="text-gray-400">None</span>}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-700">Checklist Steps</h3>
        {deployment.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            deploymentId={deploymentId}
            engineer={deployment.engineer_name}
            onUpdate={handleStepUpdate}
          />
        ))}
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (requiredPending > 0) {
                if (!confirm(`${requiredPending} required step${requiredPending !== 1 ? "s" : ""} are still pending. Complete anyway?`)) return;
              }
              complete(deploymentId);
            }}
            disabled={isCompleting}
            className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-center"
          >
            {isCompleting ? "Completing…" : "Mark Deployment Complete"}
          </button>
          <button
            onClick={() => { if (confirm("Cancel this deployment?")) cancel(deploymentId); }}
            className="px-4 py-3 sm:py-2.5 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors text-sm text-center"
          >
            Cancel Deployment
          </button>
        </div>
      )}

      {isComplete && deployment.completed_at && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800">
          Completed on {new Date(deployment.completed_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

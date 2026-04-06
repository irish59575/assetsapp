"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useDeployment } from "@/hooks/useDeployments";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STEP_STATUS_ICONS: Record<string, string> = {
  done: "✓",
  skipped: "—",
  na: "N/A",
  pending: "○",
};

export default function DeploymentPrintPage() {
  const params = useParams();
  const deploymentId = Number(params.id);
  const { data: deployment, isLoading } = useDeployment(deploymentId);

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading…</div>;
  }

  if (!deployment) {
    return <div className="p-8 text-gray-400">Deployment not found.</div>;
  }

  const doneCount = deployment.steps.filter(
    (s) => s.status === "done" || s.status === "skipped" || s.status === "na"
  ).length;

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-gray-300 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-lg"
        >
          Close
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-10 font-sans text-gray-900">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{deployment.template_name}</h1>
              <p className="text-gray-600 mt-0.5">{deployment.client_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {deployment.status === "complete" ? "COMPLETED" : deployment.status === "cancelled" ? "CANCELLED" : "IN PROGRESS"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Printed {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
          <div>
            <span className="text-gray-500">Engineer:</span>{" "}
            <span className="font-medium">{deployment.engineer_name}</span>
          </div>
          <div>
            <span className="text-gray-500">Date Started:</span>{" "}
            <span className="font-medium">{new Date(deployment.started_at).toLocaleDateString()}</span>
          </div>
          {deployment.completed_at && (
            <div>
              <span className="text-gray-500">Completed:</span>{" "}
              <span className="font-medium">{new Date(deployment.completed_at).toLocaleString()}</span>
            </div>
          )}
          {deployment.connectwise_ticket && (
            <div>
              <span className="text-gray-500">CW Ticket:</span>{" "}
              <span className="font-medium">#{deployment.connectwise_ticket}</span>
            </div>
          )}
          {deployment.device_name && (
            <div>
              <span className="text-gray-500">Device:</span>{" "}
              <span className="font-medium">{deployment.device_name}</span>
            </div>
          )}
          {deployment.serial_number && (
            <div>
              <span className="text-gray-500">Serial Number:</span>{" "}
              <span className="font-mono font-medium">{deployment.serial_number}</span>
            </div>
          )}
          {deployment.label_code && (
            <div>
              <span className="text-gray-500">Asset Label:</span>{" "}
              <span className="font-mono font-medium">{deployment.label_code}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Steps Completed:</span>{" "}
            <span className="font-medium">{doneCount} / {deployment.steps.length}</span>
          </div>
        </div>

        {deployment.notes && (
          <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm">{deployment.notes}</p>
          </div>
        )}

        {/* Steps */}
        <h2 className="text-base font-bold text-gray-900 mb-3">Checklist</h2>
        <div className="space-y-3">
          {deployment.steps.map((step, i) => (
            <div
              key={step.id}
              className={`border rounded-lg p-4 ${
                step.status === "done" ? "border-green-300 bg-green-50"
                : step.status === "skipped" ? "border-yellow-200 bg-yellow-50"
                : step.status === "na" ? "border-gray-200 bg-gray-50"
                : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                  step.status === "done" ? "border-green-500 bg-green-500 text-white"
                  : step.status === "skipped" ? "border-yellow-500 text-yellow-700"
                  : step.status === "na" ? "border-gray-300 text-gray-400"
                  : "border-gray-300 text-gray-300"
                }`}>
                  {STEP_STATUS_ICONS[step.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${step.status === "done" ? "text-green-800" : "text-gray-900"}`}>
                      {i + 1}. {step.title}
                      {!step.required && <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>}
                    </p>
                    <span className={`text-xs flex-shrink-0 font-medium ${
                      step.status === "done" ? "text-green-700"
                      : step.status === "skipped" ? "text-yellow-700"
                      : step.status === "na" ? "text-gray-400"
                      : "text-gray-400"
                    }`}>
                      {step.status === "done" ? "Done" : step.status === "skipped" ? "Skipped" : step.status === "na" ? "N/A" : "Not completed"}
                    </span>
                  </div>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                  {step.notes && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Notes:</p>
                      <p className="text-sm text-gray-700">{step.notes}</p>
                    </div>
                  )}
                  {step.photos && step.photos.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Photos:</p>
                      <div className="flex flex-wrap gap-2">
                        {step.photos.map((photo) => (
                          <img
                            key={photo.id}
                            src={`${API_BASE}/uploads/step_photos/${photo.filename}`}
                            alt="Step photo"
                            className="w-28 h-28 object-cover rounded border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {step.completed_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(step.completed_at).toLocaleString()}
                      {step.completed_by && ` · ${step.completed_by}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signature block */}
        <div className="mt-10 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-gray-500 mb-6">Engineer Signature</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">{deployment.engineer_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-6">Date</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">
              {deployment.completed_at
                ? new Date(deployment.completed_at).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400 text-center">
          Generated by AssetFlow · MSP Asset Management
        </p>
      </div>

      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}

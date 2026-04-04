"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { usePrintLabels } from "@/hooks/useLabels";

function PrintContent() {
  const searchParams = useSearchParams();
  const count = parseInt(searchParams.get("count") ?? "50", 10);
  const startCode = searchParams.get("start_code") ?? undefined;

  const { data: labelCodes = [], isLoading } = usePrintLabels(count, startCode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Loading labels...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Label Print Sheet</h1>
          <p className="text-gray-500 mt-1">
            {labelCodes.length} label{labelCodes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {labelCodes.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No unassigned labels found.</p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        >
          {labelCodes.map((code) => (
            <div
              key={code}
              className="border border-gray-300 rounded-lg p-3 flex flex-col items-center gap-2"
            >
              <QRCodeSVG value={code} size={100} level="M" />
              <span className="text-xs font-mono font-semibold text-gray-800 text-center leading-tight">
                {code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabelsPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}

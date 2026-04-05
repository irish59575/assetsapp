"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-lg mx-auto mt-16">
      <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
      <p className="text-sm font-mono bg-red-50 border border-red-200 rounded p-3 mb-4 break-all">
        {error?.message || "Unknown error"}
      </p>
      {error?.stack && (
        <pre className="text-xs bg-gray-100 rounded p-3 overflow-auto mb-4 max-h-48">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}

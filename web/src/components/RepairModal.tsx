"use client";

import React, { useState } from "react";
import { useCheckinDevice, useCheckoutDevice } from "@/hooks/useDevices";

// ---- Check-In Modal ----

interface CheckinModalProps {
  deviceId: number;
  deviceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CheckinModal({ deviceId, deviceName, onClose, onSuccess }: CheckinModalProps) {
  const [checkedInBy, setCheckedInBy] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useCheckinDevice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkedInBy.trim() || !issueDescription.trim()) {
      setError("All required fields must be filled.");
      return;
    }
    setError(null);
    mutate(
      { id: deviceId, payload: { checked_in_by: checkedInBy, issue_description: issueDescription } },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (e) => setError((e as Error).message),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Check In for Repair</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{deviceName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checked in by <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Your name"
              value={checkedInBy}
              onChange={(e) => setCheckedInBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              placeholder="Describe the issue..."
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-yellow-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-yellow-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Checking In..." : "Check In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Check-Out Modal ----

interface CheckoutModalProps {
  deviceId: number;
  deviceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CheckoutModal({ deviceId, deviceName, onClose, onSuccess }: CheckoutModalProps) {
  const [checkedOutBy, setCheckedOutBy] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useCheckoutDevice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkedOutBy.trim()) {
      setError("Checked out by is required.");
      return;
    }
    setError(null);
    mutate(
      {
        id: deviceId,
        payload: {
          checked_out_by: checkedOutBy,
          resolution_notes: resolutionNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (e) => setError((e as Error).message),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Check Out (Repair Complete)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{deviceName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checked out by <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your name"
              value={checkedOutBy}
              onChange={(e) => setCheckedOutBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="What was done to fix the issue? (optional)"
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Completing..." : "Complete Repair"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

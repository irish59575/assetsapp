"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAssets, useDeleteAsset } from "@/hooks/useAssets";
import { AssetCard } from "@/components/AssetCard";
import { Input } from "@/components/ui/Input";
import type { AssetStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
  { value: "disposed", label: "Disposed" },
  { value: "lost", label: "Lost" },
];

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: assets = [], isLoading } = useAssets({
    search: debouncedSearch || undefined,
    status: status || undefined,
    limit: 50,
  });

  const { mutate: deleteAsset } = useDeleteAsset();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAsset(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <p className="text-gray-500 mt-1">{assets.length} asset{assets.length !== 1 ? "s" : ""} found</p>
        </div>
        <Link
          href="/assets/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Asset
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
          <p className="text-gray-500 text-lg">No assets found</p>
          <Link href="/assets/new" className="text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block">
            Add your first asset
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useAssets } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useAuth";
import type { AssetStatus } from "@/types";

const STATUS_COLORS: Record<AssetStatus, string> = {
  active: "text-green-600 bg-green-50",
  inactive: "text-gray-600 bg-gray-50",
  maintenance: "text-yellow-600 bg-yellow-50",
  disposed: "text-red-600 bg-red-50",
  lost: "text-orange-600 bg-orange-50",
};

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: assets = [], isLoading } = useAssets({ limit: 100 });

  const counts = assets.reduce(
    (acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const recentAssets = [...assets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Total Assets", value: assets.length, color: "bg-brand-600 text-white" },
    { label: "Active", value: counts.active ?? 0, color: "bg-green-500 text-white" },
    { label: "In Maintenance", value: counts.maintenance ?? 0, color: "bg-yellow-500 text-white" },
    { label: "Lost / Disposed", value: (counts.lost ?? 0) + (counts.disposed ?? 0), color: "bg-red-500 text-white" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.full_name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your assets.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <p className="text-3xl font-bold">{isLoading ? "—" : stat.value}</p>
            <p className="text-sm opacity-90 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/assets/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Asset
        </Link>
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View All Assets
        </Link>
      </div>

      {/* Recent assets */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Assets</h3>
          <Link href="/assets" className="text-sm text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : recentAssets.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No assets yet. Add your first one!</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentAssets.map((asset) => (
              <li key={asset.id}>
                <Link href={`/assets/${asset.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                    {asset.category_rel && (
                      <p className="text-xs text-gray-500">{asset.category_rel.name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      STATUS_COLORS[asset.status as AssetStatus] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {asset.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

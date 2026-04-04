import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { Asset, AssetStatus } from "@/types";

interface AssetCardProps {
  asset: Asset;
  onDelete?: (id: number) => void;
}

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
  maintenance: { label: "Maintenance", className: "bg-yellow-100 text-yellow-700" },
  disposed: { label: "Disposed", className: "bg-red-100 text-red-600" },
  lost: { label: "Lost", className: "bg-orange-100 text-orange-700" },
};

export function AssetCard({ asset, onDelete }: AssetCardProps) {
  const status = statusConfig[asset.status] ?? statusConfig.active;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {asset.image_url ? (
        <img
          src={asset.image_url}
          alt={asset.name}
          className="w-full h-36 object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
          {asset.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{asset.description}</p>
          )}
        </div>
        <span className={clsx("text-xs font-medium px-2 py-1 rounded-full shrink-0", status.className)}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {asset.category_rel && (
          <span
            className="px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${asset.category_rel.color}20`, color: asset.category_rel.color }}
          >
            {asset.category_rel.name}
          </span>
        )}
        {asset.location_rel && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {asset.location_rel.name}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <Link
          href={`/assets/${asset.id}`}
          className="flex-1 text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-1"
        >
          View
        </Link>
        <Link
          href={`/assets/${asset.id}?edit=true`}
          className="flex-1 text-center text-sm text-gray-600 hover:text-gray-700 font-medium py-1"
        >
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(asset.id)}
            className="flex-1 text-center text-sm text-red-500 hover:text-red-600 font-medium py-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default AssetCard;

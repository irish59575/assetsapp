"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAsset, useDeleteAsset } from "@/hooks/useAssets";
import { QRCodeDisplay } from "@/components/QRCode";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const assetId = Number(id);

  const { data: asset, isLoading, error } = useAsset(assetId);
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

  const handleDelete = () => {
    if (confirm("Delete this asset? This action cannot be undone.")) {
      deleteAsset(assetId, {
        onSuccess: () => router.push("/assets"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Asset not found.</p>
        <Link href="/assets" className="text-brand-600 hover:text-brand-700 mt-2 inline-block">
          Back to assets
        </Link>
      </div>
    );
  }

  const fields = [
    { label: "Status", value: asset.status },
    { label: "Serial Number", value: asset.serial_number },
    { label: "Barcode", value: asset.barcode },
    { label: "Purchase Price", value: asset.purchase_price ? `$${asset.purchase_price}` : null },
    {
      label: "Purchase Date",
      value: asset.purchase_date ? format(new Date(asset.purchase_date), "MMM d, yyyy") : null,
    },
    { label: "Category", value: asset.category_rel?.name },
    { label: "Location", value: asset.location_rel?.name },
    { label: "Added", value: format(new Date(asset.created_at), "MMM d, yyyy 'at' h:mm a") },
    { label: "Last Updated", value: format(new Date(asset.updated_at), "MMM d, yyyy 'at' h:mm a") },
  ];

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/assets" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assets
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
          {asset.description && <p className="text-gray-500 mt-1">{asset.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/assets/${asset.id}?edit=true`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>

        {/* QR Code */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-3">
            <h3 className="font-semibold text-gray-900 self-start">QR Code</h3>
            <QRCodeDisplay
              value={`asset:${asset.id}`}
              size={180}
              dataUrl={asset.qr_code}
            />
          </div>
          {asset.image_url && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Image</h3>
              <img
                src={asset.image_url}
                alt={asset.name}
                className="w-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

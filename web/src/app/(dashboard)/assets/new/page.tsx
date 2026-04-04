"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAsset } from "@/hooks/useAssets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_price: z.string().optional(),
  barcode: z.string().optional(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "maintenance", "disposed", "lost"]).default("active"),
  category_id: z.coerce.number().optional(),
  location_id: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewAssetPage() {
  const router = useRouter();
  const { mutate: createAsset, isPending, error } = useCreateAsset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      image_url: data.image_url || undefined,
      category_id: data.category_id || undefined,
      location_id: data.location_id || undefined,
    };
    createAsset(payload, {
      onSuccess: (asset) => router.push(`/assets/${asset.id}`),
    });
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/assets" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Assets
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Add New Asset</h2>
        <p className="text-gray-500 mt-1">Fill in the details for your new asset.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input label="Asset Name *" placeholder="e.g. MacBook Pro 16&quot;" error={errors.name?.message} {...register("name")} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              placeholder="Optional description..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" placeholder="SN-XXXXXXXXX" error={errors.serial_number?.message} {...register("serial_number")} />
            <Input label="Barcode" placeholder="123456789" error={errors.barcode?.message} {...register("barcode")} />
          </div>
          <Input label="Purchase Price" placeholder="1299.99" error={errors.purchase_price?.message} {...register("purchase_price")} />
          <Input label="Image URL" placeholder="https://..." error={errors.image_url?.message} {...register("image_url")} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...register("status")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="disposed">Disposed</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {(error as any)?.response?.data?.detail ?? "Failed to create asset."}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isPending} className="flex-1">
              Create Asset
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

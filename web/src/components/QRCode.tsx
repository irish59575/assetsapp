"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  dataUrl?: string | null;
}

export function QRCodeDisplay({ value, size = 200, title, dataUrl }: QRCodeDisplayProps) {
  const handleDownload = () => {
    if (dataUrl) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `qrcode-${value}.png`;
      link.click();
      return;
    }
    // Fallback: export SVG as PNG via canvas
    const svg = document.querySelector("#qr-svg") as SVGSVGElement | null;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${value}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm w-fit">
      {title && <p className="text-sm font-medium text-gray-700">{title}</p>}
      {dataUrl ? (
        <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded" />
      ) : (
        <QRCodeSVG
          id="qr-svg"
          value={value}
          size={size}
          level="M"
          includeMargin
        />
      )}
      <button
        onClick={handleDownload}
        className="text-xs text-brand-600 hover:text-brand-700 font-medium underline"
      >
        Download QR Code
      </button>
    </div>
  );
}

export default QRCodeDisplay;

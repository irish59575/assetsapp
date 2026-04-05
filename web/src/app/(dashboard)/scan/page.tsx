"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type ScanState = "idle" | "scanning" | "loading" | "error";

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCode, setLastCode] = useState("");

  const startScanner = async () => {
    setState("scanning");
    setErrorMsg("");

    // Dynamically import to avoid SSR issues
    const { Html5Qrcode } = await import("html5-qrcode");

    if (!containerRef.current) return;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (decodedText === lastCode) return;
          setLastCode(decodedText);

          // Stop scanner immediately
          try { await scanner.stop(); } catch {}
          setState("loading");

          // Look up device by QR code
          try {
            const { data } = await api.get(`/devices/scan/${encodeURIComponent(decodedText)}`);
            router.push(`/devices/${data.id}`);
          } catch (e: any) {
            const detail = e?.response?.data?.detail ?? "Device not found for this QR code.";
            setErrorMsg(detail);
            setState("error");
          }
        },
        () => {} // ignore frame errors
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not access camera. Check browser permissions.");
      setState("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setState("idle");
    setLastCode("");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Scan QR Code</h2>
      <p className="text-sm text-gray-500 mb-6">Point the camera at a device QR label to look it up.</p>

      {/* Scanner viewport */}
      <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1/1" }}>
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900">
            <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-gray-400 text-sm">Camera not started</p>
          </div>
        )}

        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Looking up device…</p>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900 p-6">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-300 text-sm text-center">{errorMsg}</p>
            <button
              onClick={() => { setState("idle"); setLastCode(""); }}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* html5-qrcode mounts here */}
        <div
          id="qr-reader"
          ref={containerRef}
          className={state === "scanning" ? "w-full h-full" : "hidden"}
        />

        {/* Scan overlay corners */}
        {state === "scanning" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {state === "idle" || state === "error" ? (
        <button
          onClick={startScanner}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Start Camera
        </button>
      ) : state === "scanning" ? (
        <button
          onClick={stopScanner}
          className="w-full py-3.5 bg-gray-200 text-gray-700 font-semibold rounded-xl text-base hover:bg-gray-300 transition-colors"
        >
          Stop
        </button>
      ) : null}

      <p className="text-xs text-gray-400 text-center mt-4">
        Requires camera permission. Works on Chrome, Safari, and most mobile browsers.
      </p>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h2 style={{ color: "red" }}>Error</h2>
        <p style={{ fontFamily: "monospace", background: "#fee", padding: "1rem", borderRadius: "4px", wordBreak: "break-all" }}>
          {error?.message || "No message"}
        </p>
        <pre style={{ fontSize: "11px", background: "#f5f5f5", padding: "1rem", overflow: "auto", maxHeight: "300px" }}>
          {error?.stack || "No stack"}
        </pre>
        <p>Digest: {error?.digest}</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://127.0.0.1:8000";

// These collection endpoints need a trailing slash (FastAPI registers them with /)
const TRAILING_SLASH_PATHS = new Set([
  "/api/v1/clients",
  "/api/v1/devices",
  "/api/v1/templates",
  "/api/v1/deployments",
  "/api/v1/users",
  "/api/v1/categories",
  "/api/v1/locations",
  "/api/v1/assets",
  "/api/v1/labels",
]);

async function proxy(req: NextRequest): Promise<NextResponse> {
  const incomingPath = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  // Add trailing slash only for known collection endpoints
  const needsSlash = TRAILING_SLASH_PATHS.has(incomingPath) && !incomingPath.endsWith("/");
  const backendPath = needsSlash ? incomingPath + "/" : incomingPath;
  const url = `${BACKEND}${backendPath}${search}`;

  // Forward all headers except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  // Read body as buffer once
  let body: ArrayBuffer | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body: body ?? undefined,
    redirect: "follow",
  });

  // Forward response headers
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "transfer-encoding" && lower !== "connection") {
      resHeaders.set(key, value);
    }
  });

  const responseBody = await backendRes.arrayBuffer();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

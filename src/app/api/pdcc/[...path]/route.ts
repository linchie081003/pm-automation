import { NextResponse } from "next/server";
import { getPdccApiBaseUrl } from "@/lib/pdcc-api";

export const runtime = "nodejs";

async function proxyToBackend(request: Request, pathSegments: string[]) {
  const backendPath = pathSegments.join("/");
  const incoming = new URL(request.url);
  const url = new URL(`${getPdccApiBaseUrl()}/api/${backendPath}`);
  incoming.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: `Backend tidak reachable di ${getPdccApiBaseUrl()}: ${message}` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    return NextResponse.json(
      {
        error: `Route backend tidak ditemukan atau error HTML: ${request.method} /${backendPath}`,
        upstreamStatus: upstream.status,
        hint: "Jalankan npm run dev dari root agar API port 4000 terbaru.",
      },
      { status: upstream.status >= 400 ? upstream.status : 502 },
    );
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

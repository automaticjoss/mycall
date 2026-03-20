import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://5.189.144.48:8000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;
  try {
    const res = await fetch(target, {
      headers: Object.fromEntries(
        [...req.headers.entries()].filter(([k]) => !["host", "connection"].includes(k.toLowerCase()))
      ),
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("audio") || contentType.includes("octet-stream")) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: { "content-type": contentType },
      });
    }
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": contentType || "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;
  try {
    const contentType = req.headers.get("content-type") || "application/json";
    const body = await req.arrayBuffer();
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...Object.fromEntries(
          [...req.headers.entries()].filter(([k]) =>
            !["host", "connection", "content-length", "transfer-encoding"].includes(k.toLowerCase())
          )
        ),
      },
      body,
    });
    const resContentType = res.headers.get("content-type") || "";
    if (resContentType.includes("audio") || resContentType.includes("octet-stream")) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: { "content-type": resContentType },
      });
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": resContentType || "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

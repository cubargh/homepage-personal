import { NextRequest, NextResponse } from "next/server";

const F1_API_DEV_BASE = "https://f1api.dev/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  // Allowed paths
  // - current/next
  // - current/drivers-championship
  // - current/constructors-championship
  
  if (!["current/next", "current/drivers-championship", "current/constructors-championship"].includes(path)) {
       return NextResponse.json({ error: "Endpoint not supported" }, { status: 501 });
  }

  const url = `${F1_API_DEV_BASE}/${path}`;

  try {
    const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        return NextResponse.json({ error: "Upstream Error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

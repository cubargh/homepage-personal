import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: "HEAD", // Try HEAD first to be lightweight
      signal: controller.signal,
    });
    clearTimeout(id);

    const latency = Date.now() - start;

    // Treat 4xx codes as UP because the service is reachable, just authorized/restricted
    // Typically 401 Unauthorized or 403 Forbidden means the service is there.
    // Even 404 means the server responded.
    // We really only want DOWN for network errors or 500s if desired, but 500 is also "reachable".
    // So we consider it UP if we got a response.
    const isUp = response.status < 500 || response.status === 503 ? true : true; // Actually any response means it's online/reachable

    return NextResponse.json({
      url,
      status: "UP", // If fetch succeeded without throwing, the service is technically "UP"
      statusCode: response.status,
      latency,
    });
  } catch (error) {
    // If HEAD fails (some servers don't support it), try GET
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(id);
      const latency = Date.now() - start;

       return NextResponse.json({
        url,
        status: "UP", // Any response is success for connectivity check
        statusCode: response.status,
        latency,
      });

    } catch (innerError) {
         return NextResponse.json({
            url,
            status: "DOWN",
            latency: Date.now() - start,
            error: "Unreachable",
        }, { status: 200 }); // Return 200 so the frontend handles the "DOWN" state gracefully
    }
  }
}


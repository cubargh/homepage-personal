import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, requireQueryParam } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

async function checkServiceStatus(url: string) {
  const start = Date.now();
  const timeout = 5000; // 5s timeout

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD", // Try HEAD first to be lightweight
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - start;

    // Any HTTP response means the service is reachable
    // 4xx codes (401, 403, 404) mean the service is UP but may require auth or the resource doesn't exist
    // 5xx codes (except 503) mean the service is UP but having issues
    // 503 Service Unavailable could mean the service is temporarily down
    const status = response.status === 503 ? "DOWN" : "UP";

    return {
      url,
      status,
      statusCode: response.status,
      latency,
    };
  } catch {
    // If HEAD fails (some servers don't support it), try GET
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      const status = response.status === 503 ? "DOWN" : "UP";

      return {
        url,
        status,
        statusCode: response.status,
        latency,
      };
    } catch (innerError) {
      return {
        url,
        status: "DOWN",
        latency: Date.now() - start,
        error: innerError instanceof Error ? innerError.message : "Unreachable",
      };
    }
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = requireQueryParam(request, "url");

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new ApiError("Invalid URL format", 400, ApiErrorCode.VALIDATION_ERROR);
  }

  const result = await checkServiceStatus(url);
  
  // Return 200 so the frontend handles the "DOWN" state gracefully
  return NextResponse.json(result, { status: 200 });
});



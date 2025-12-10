import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, requireQueryParam } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

const F1_API_DEV_BASE = "https://f1api.dev/api";
const ALLOWED_PATHS = [
  "current/next",
  "current/drivers-championship",
  "current/constructors-championship",
] as const;

// Force dynamic rendering due to query parameters
// Note: revalidate is not compatible with force-dynamic, so we rely on Cache-Control headers and in-memory caching
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const path = requireQueryParam(request, "path");

  if (!ALLOWED_PATHS.includes(path as typeof ALLOWED_PATHS[number])) {
    throw new ApiError("Endpoint not supported", 501, ApiErrorCode.INTERNAL_ERROR);
  }

  const url = `${F1_API_DEV_BASE}/${path}`;

  const fetchResponse = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!fetchResponse.ok) {
    throw new ApiError("Upstream Error", fetchResponse.status, ApiErrorCode.UPSTREAM_ERROR);
  }

  let data: unknown;
  try {
    data = await fetchResponse.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse F1 API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  const response = NextResponse.json(data);
  // Cache for 1 hour
  response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
  return response;
});

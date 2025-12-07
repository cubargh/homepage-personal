import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, requireQueryParam } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

const F1_API_DEV_BASE = "https://f1api.dev/api";
const ALLOWED_PATHS = [
  "current/next",
  "current/drivers-championship",
  "current/constructors-championship",
] as const;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const path = requireQueryParam(request, "path");

  if (!ALLOWED_PATHS.includes(path as typeof ALLOWED_PATHS[number])) {
    throw new ApiError("Endpoint not supported", 501, ApiErrorCode.INTERNAL_ERROR);
  }

  const url = `${F1_API_DEV_BASE}/${path}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new ApiError("Upstream Error", response.status, ApiErrorCode.UPSTREAM_ERROR);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse F1 API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json(data);
});

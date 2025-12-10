import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

// Cache Immich stats for 1 hour
export const revalidate = 3600;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const immichConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.immich),
    "Immich configuration missing or disabled"
  );

  if (!immichConfig.api_key || !immichConfig.url) {
    throw new ApiError(
      "Immich configuration incomplete",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, api_key } = immichConfig;

  // Ensure URL does not end with /api or / since we append /api/server/statistics
  const baseUrl = url.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const apiUrl = `${baseUrl}/api/server/statistics`;

  const fetchResponse = await fetch(apiUrl, {
    headers: {
      "x-api-key": api_key,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text().catch(() => "Unknown error");
    throw new ApiError(
      "Upstream Error",
      fetchResponse.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let data: unknown;
  try {
    data = await fetchResponse.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse Immich API response",
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

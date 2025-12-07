import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

export const GET = withErrorHandling(async (request: NextRequest) => {
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

  const response = await fetch(apiUrl, {
    headers: {
      "x-api-key": api_key,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      "Upstream Error",
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse Immich API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json(data);
});

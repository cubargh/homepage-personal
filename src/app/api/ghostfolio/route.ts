import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

// Cache Ghostfolio for 5 minutes
export const revalidate = 300;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const ghostfolioConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.ghostfolio),
    "Ghostfolio configuration missing or disabled"
  );

  if (!ghostfolioConfig.public_token || !ghostfolioConfig.url) {
    throw new ApiError(
      "Ghostfolio configuration incomplete",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, public_token } = ghostfolioConfig;

  // Clean base URL
  const baseUrl = url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/api/v1/public/${public_token}/portfolio`;

  const fetchResponse = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
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
      "Failed to parse Ghostfolio API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  const response = NextResponse.json(data);
  // Cache for 5 minutes
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
});

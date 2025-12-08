import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

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

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
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
      "Failed to parse Ghostfolio API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json(data);
});

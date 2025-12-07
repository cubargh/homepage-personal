import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

const BASE_URL = "https://padelapi.org/api";
const DAYS_AHEAD = 60; // Extended range to catch future tournaments

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "matches";

  const config = loadConfig();

  // Check new sports config first
  const sportsConfig = getFirstEnabledWidgetConfig(config.widgets.sports);
  const API_TOKEN = sportsConfig?.padel?.api_token;

  if (!API_TOKEN) {
    throw new ApiError("API Configuration Missing", 500, ApiErrorCode.MISSING_CONFIG);
  }

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + DAYS_AHEAD);

  const dateFrom = today.toISOString().split("T")[0];
  const dateTo = nextMonth.toISOString().split("T")[0];

  let url: string;

  switch (endpoint) {
    case "matches":
      url = `${BASE_URL}/matches?after_date=${dateFrom}&before_date=${dateTo}&sort_by=played_at&order_by=asc&per_page=30`;
      break;

    case "tournaments":
      url = `${BASE_URL}/tournaments?after_date=${dateFrom}&sort_by=start_date&order_by=asc&per_page=10`;
      break;

    default:
      throw new ApiError("Invalid endpoint", 400, ApiErrorCode.BAD_REQUEST);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 }, // Cache for 1 minute
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
      "Failed to parse Padel API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json(data);
});


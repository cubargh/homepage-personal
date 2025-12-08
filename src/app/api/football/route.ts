import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

const BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_COMPETITIONS = "PL,PD,BL1,SA,CL,EL";
const DAYS_AHEAD = 6; // API limit is 10 days

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "matches";

  const config = loadConfig();

  // Check new sports config first
  const sportsConfig = getFirstEnabledWidgetConfig(config.widgets.sports);
  let API_KEY = sportsConfig?.football?.api_key;

  // Fallback to old football config for backward compatibility
  if (!API_KEY) {
    const footballConfig = getFirstEnabledWidgetConfig(config.widgets.football);
    API_KEY = footballConfig?.api_key;
  }

  if (!API_KEY) {
    throw new ApiError("API Configuration Missing", 500, ApiErrorCode.MISSING_CONFIG);
  }

  // If the frontend requests matches, we enforce our specific filters for security/simplicity
  if (endpoint !== "matches") {
    throw new ApiError("Invalid Endpoint", 400, ApiErrorCode.BAD_REQUEST);
  }

  // Default set of competitions if none specified
  const requestedCompetition = searchParams.get("competition");

  // Use dateFrom and dateTo to get a wider range of matches
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + DAYS_AHEAD);

  const dateFrom = today.toISOString().split("T")[0];
  let dateTo = nextWeek.toISOString().split("T")[0];

  let url: string;

  if (requestedCompetition === "TODAY") {
    // If "Today's Matches" is selected, fetch matches for today.
    // Request a slightly wider window (today + tomorrow) to account for timezone differences
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dateTo = tomorrow.toISOString().split("T")[0];

    // URL without competitions filter to get everything
    url = `${BASE_URL}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  } else {
    const competitions = requestedCompetition || DEFAULT_COMPETITIONS;
    url = `${BASE_URL}/matches?competitions=${competitions}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  }

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": API_KEY,
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
      "Failed to parse football API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json(data);
});

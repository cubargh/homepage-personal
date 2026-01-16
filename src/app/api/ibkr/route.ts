import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { cached } from "@/lib/cache";
import { fetchIbkrPortfolio, IbkrPortfolioData } from "@/lib/ibkr-client";

// Cache IBKR data for 15 minutes (IB updates once daily anyway)
export const revalidate = 900;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const ibkrConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.ibkr),
    "IBKR configuration missing or disabled"
  );

  if (!ibkrConfig.token || !ibkrConfig.query_id) {
    throw new ApiError(
      "IBKR configuration incomplete - token and query_id are required",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { token, query_id, show_positions, position_count } = ibkrConfig;

  // Use cache helper with 15 minute TTL
  const data = await cached<IbkrPortfolioData>(
    `ibkr_portfolio_${query_id}`,
    async () => fetchIbkrPortfolio(token, query_id),
    15 * 60 * 1000 // 15 minutes
  );

  // Filter positions if configured
  let positions = data.positions;
  if (show_positions === false) {
    positions = [];
  } else if (position_count && position_count > 0) {
    positions = positions.slice(0, position_count);
  }

  const responseData = {
    ...data,
    positions,
  };

  const response = NextResponse.json(responseData);
  // Cache for 15 minutes
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=900, stale-while-revalidate=1800"
  );
  return response;
});

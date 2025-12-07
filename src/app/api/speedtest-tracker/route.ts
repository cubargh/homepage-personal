import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

interface SpeedtestApiResponse {
  data?: {
    download_bits?: number;
    upload_bits?: number;
    ping?: number;
    created_at?: string;
  };
  download_bits?: number;
  upload_bits?: number;
  ping?: number;
  created_at?: string;
}

const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_SPEED_MBPS = 10000;
const MAX_PING_MS = 10000;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();
  const speedtestConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.speedtest_tracker),
    "Speedtest Tracker configuration missing or disabled"
  );

  if (!speedtestConfig.url || !speedtestConfig.api_token) {
    throw new ApiError(
      "Speedtest Tracker URL and API token required",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, api_token } = speedtestConfig;

  // Validate URL format
  let baseUrl: string;
  try {
    const urlObj = new URL(url);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    throw new ApiError("Invalid URL format", 400, ApiErrorCode.VALIDATION_ERROR);
  }

  // Construct API endpoint
  const apiUrl = `${baseUrl}/api/v1/results/latest`;

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${api_token}`,
      },
      signal: controller.signal,
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError(
          "Unauthorized - Check API token",
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }
      if (response.status === 403) {
        throw new ApiError(
          "Forbidden - API token missing 'results:read' scope",
          403,
          ApiErrorCode.FORBIDDEN
        );
      }
      if (response.status === 404) {
        throw new ApiError(
          "No speedtest results found",
          404,
          ApiErrorCode.NOT_FOUND
        );
      }
      const errorText = await response.text().catch(() => "Unknown error");
      throw new ApiError(
        "Upstream Error",
        response.status,
        ApiErrorCode.UPSTREAM_ERROR,
        errorText
      );
    }

    let responseData: SpeedtestApiResponse;
    try {
      responseData = (await response.json()) as SpeedtestApiResponse;
    } catch (error) {
      throw new ApiError(
        "Failed to parse Speedtest Tracker API response",
        502,
        ApiErrorCode.UPSTREAM_ERROR,
        error instanceof Error ? error.message : "Unknown parsing error"
      );
    }

    // Extract values from API response
    const result = responseData.data || responseData;

    const downloadBits =
      typeof result.download_bits === "number" ? result.download_bits : null;
    const uploadBits =
      typeof result.upload_bits === "number" ? result.upload_bits : null;
    const ping = typeof result.ping === "number" ? result.ping : null;
    const createdAt =
      typeof result.created_at === "string" ? result.created_at : null;

    // Convert bits to Mbps (divide by 1,000,000)
    const download = downloadBits !== null ? downloadBits / 1000000 : null;
    const upload = uploadBits !== null ? uploadBits / 1000000 : null;

    // Validate values are reasonable
    const isValidSpeed = (val: number | null): boolean =>
      val !== null && val >= 0 && val <= MAX_SPEED_MBPS;

    const isValidPing = (val: number | null): boolean =>
      val !== null && val >= 0 && val <= MAX_PING_MS;

    if (
      download === null ||
      upload === null ||
      ping === null ||
      !isValidSpeed(download) ||
      !isValidSpeed(upload) ||
      !isValidPing(ping)
    ) {
      throw new ApiError(
        "Invalid data received from API",
        502,
        ApiErrorCode.UPSTREAM_ERROR,
        { download, upload, ping }
      );
    }

    return NextResponse.json({
      download,
      upload,
      ping,
      createdAt,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timeout", 504, ApiErrorCode.TIMEOUT);
    }
    throw error;
  }
});

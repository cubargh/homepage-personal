import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();
  const qbConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.qbittorrent),
    "qBittorrent configuration missing or disabled"
  );

  if (!qbConfig.url) {
    throw new ApiError(
      "qBittorrent URL not configured",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, user, password } = qbConfig;
  const baseUrl = url.replace(/\/$/, "");

  let cookieHeader = "";

  // 1. Authenticate if credentials are provided
  if (user && password) {
    const loginParams = new URLSearchParams();
    loginParams.append("username", user);
    loginParams.append("password", password);

    const loginRes = await fetch(`${baseUrl}/api/v2/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: loginParams,
    });

    if (!loginRes.ok) {
      throw new ApiError(
        "qBittorrent authentication failed",
        401,
        ApiErrorCode.UNAUTHORIZED
      );
    }

    // Extract SID cookie
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/SID=([^;]+)/);
      if (match) {
        cookieHeader = `SID=${match[1]}`;
      }
    }
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  // 2. Parallel requests
  const [transferRes, seedingRes, leechingRes] = await Promise.all([
    fetch(`${baseUrl}/api/v2/transfer/info`, { headers }),
    fetch(`${baseUrl}/api/v2/torrents/info?filter=seeding`, { headers }),
    fetch(`${baseUrl}/api/v2/torrents/info?filter=downloading`, { headers }),
  ]);

  if (!transferRes.ok || !seedingRes.ok || !leechingRes.ok) {
    throw new ApiError(
      "Failed to fetch qBittorrent data",
      502,
      ApiErrorCode.UPSTREAM_ERROR
    );
  }

  let transfer: unknown;
  let seeding: unknown;
  let leeching: unknown;

  try {
    transfer = await transferRes.json();
    seeding = await seedingRes.json();
    leeching = await leechingRes.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse qBittorrent API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return NextResponse.json({
    transfer,
    seeding,
    leeching,
  });
});


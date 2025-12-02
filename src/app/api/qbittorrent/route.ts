import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const qbConfig = getFirstEnabledWidgetConfig(config.widgets.qbittorrent);

  if (!qbConfig || !qbConfig.url) {
    return NextResponse.json(
      { error: "qBittorrent configuration missing or disabled" },
      { status: 500 }
    );
  }

  const { url, user, password } = qbConfig;
  const baseUrl = url.replace(/\/$/, "");

  let cookieHeader = "";

  // 1. Authenticate if credentials are provided
  if (user && password) {
    try {
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
        console.error("qBittorrent Login Failed:", loginRes.status);
        // Continue anyway? No, if creds provided and fail, it's an error.
        return NextResponse.json(
          { error: "Authentication Failed" },
          { status: 401 }
        );
      }

      // Extract SID cookie
      const setCookie = loginRes.headers.get("set-cookie");
      if (setCookie) {
        // Simple extraction of SID
        const match = setCookie.match(/SID=([^;]+)/);
        if (match) {
          cookieHeader = `SID=${match[1]}`;
        }
      }
    } catch (e) {
      console.error("qBittorrent Auth Error:", e);
      return NextResponse.json(
        { error: "Authentication Error" },
        { status: 500 }
      );
    }
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  try {
    // 2. Parallel requests
    const [transferRes, seedingRes, leechingRes] = await Promise.all([
      fetch(`${baseUrl}/api/v2/transfer/info`, { headers }),
      fetch(`${baseUrl}/api/v2/torrents/info?filter=seeding`, { headers }),
      fetch(`${baseUrl}/api/v2/torrents/info?filter=downloading`, { headers }),
    ]);

    if (!transferRes.ok || !seedingRes.ok || !leechingRes.ok) {
      console.error(
        "qBittorrent Fetch Error:",
        transferRes.status,
        seedingRes.status,
        leechingRes.status
      );
      return NextResponse.json(
        { error: "Failed to fetch qBittorrent data" },
        { status: 500 }
      );
    }

    const transfer = await transferRes.json();
    const seeding = await seedingRes.json();
    const leeching = await leechingRes.json();

    return NextResponse.json({
      transfer,
      seeding,
      leeching,
    });
  } catch (error) {
    console.error("qBittorrent Internal Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


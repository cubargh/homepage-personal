import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const immichConfig = getFirstEnabledWidgetConfig(config.widgets.immich);

  if (!immichConfig || !immichConfig.api_key || !immichConfig.url) {
    return NextResponse.json(
      { error: "Immich configuration missing or disabled" },
      { status: 500 }
    );
  }

  const { url, api_key } = immichConfig;

  // Ensure URL does not end with /api or / since we append /api/server/statistics
  const baseUrl = url.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const apiUrl = `${baseUrl}/api/server/statistics`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "x-api-key": api_key,
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Immich API Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Upstream Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Immich Internal Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

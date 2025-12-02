import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const ghostfolioConfig = getFirstEnabledWidgetConfig(config.widgets.ghostfolio);

  if (
    !ghostfolioConfig ||
    !ghostfolioConfig.public_token ||
    !ghostfolioConfig.url
  ) {
    return NextResponse.json(
      { error: "Ghostfolio configuration missing or disabled" },
      { status: 500 }
    );
  }

  const { url, public_token } = ghostfolioConfig;

  // Example: https://your-ghostfolio-instance.com/api/v1/portfolio/public/YOUR-PUBLIC-ID
  // The user guide says: https://your-ghostfolio-instance.com/api/v1/public/YOUR-PUBLIC-ID/portfolio
  // Let's verify the endpoint structure from the prompt.
  // Prompt says: https://your-ghostfolio-instance.com/api/v1/public/YOUR-PUBLIC-ID/portfolio

  // Clean base URL
  const baseUrl = url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/api/v1/public/${public_token}/portfolio`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ghostfolio API Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Upstream Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ghostfolio Internal Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

const BASE_URL = "https://padelapi.org/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "matches";
  
  const config = loadConfig();
  
  // Check new sports config first
  const sportsConfig = getFirstEnabledWidgetConfig(config.widgets.sports);
  const API_TOKEN = sportsConfig?.padel?.api_token;
  
  if (!API_TOKEN) {
    return NextResponse.json({ error: "API Configuration Missing" }, { status: 500 });
  }

  try {
    let url = "";
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 60); // Extend to 60 days to catch future tournaments

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = nextMonth.toISOString().split('T')[0];

    switch (endpoint) {
      case "matches":
        // Get upcoming matches (future matches or matches from today)
        // Note: We can filter for live matches by checking status field in the response
        // Extended range to 60 days to catch matches from upcoming tournaments
        url = `${BASE_URL}/matches?after_date=${dateFrom}&before_date=${dateTo}&sort_by=played_at&order_by=asc&per_page=30`;
        break;
      
      case "tournaments":
        // Get upcoming tournaments
        url = `${BASE_URL}/tournaments?after_date=${dateFrom}&sort_by=start_date&order_by=asc&per_page=10`;
        break;
      
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Accept": "application/json",
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Upstream Error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Padel API error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


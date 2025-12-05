import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const speedtestConfig = getFirstEnabledWidgetConfig(config.widgets.speedtest_tracker);

  if (!speedtestConfig || !speedtestConfig.url || !speedtestConfig.api_token) {
    return NextResponse.json(
      { error: "Speedtest Tracker configuration missing or disabled. URL and API token required." },
      { status: 500 }
    );
  }

  const { url, api_token } = speedtestConfig;

  // Validate URL format
  let baseUrl: string;
  try {
    const urlObj = new URL(url);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  // Construct API endpoint
  const apiUrl = `${baseUrl}/api/v1/results/latest`;

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
        return NextResponse.json(
          { error: "Unauthorized - Check API token" },
          { status: 401 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: "Forbidden - API token missing 'results:read' scope" },
          { status: 403 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: "No speedtest results found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Upstream Error" },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Extract values from API response
    // The API returns: { data: { download_bits, upload_bits, ping, created_at }, message: 'ok' }
    // download_bits/upload_bits are in bits, convert to Mbps (divide by 1,000,000)
    const result = responseData.data || responseData;
    
    const downloadBits = typeof result.download_bits === 'number' ? result.download_bits : null;
    const uploadBits = typeof result.upload_bits === 'number' ? result.upload_bits : null;
    const ping = typeof result.ping === 'number' ? result.ping : null;
    const createdAt = typeof result.created_at === 'string' ? result.created_at : null;

    // Convert bits to Mbps (divide by 1,000,000)
    const download = downloadBits !== null ? downloadBits / 1000000 : null;
    const upload = uploadBits !== null ? uploadBits / 1000000 : null;

    // Validate values are reasonable
    const isValidSpeed = (val: number | null): boolean => 
      val !== null && val >= 0 && val <= 10000; // 0-10000 Mbps reasonable range
    
    const isValidPing = (val: number | null): boolean => 
      val !== null && val >= 0 && val <= 10000; // 0-10000 ms reasonable range

    if (
      download === null || 
      upload === null || 
      ping === null ||
      !isValidSpeed(download) ||
      !isValidSpeed(upload) ||
      !isValidPing(ping)
    ) {
      console.error("Invalid speedtest data from API:", {
        download,
        upload,
        ping,
        rawData: responseData,
      });
      return NextResponse.json(
        { error: "Invalid data received from API" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      download,
      upload,
      ping,
      createdAt,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 504 }
      );
    }
    console.error("Speedtest Tracker Internal Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

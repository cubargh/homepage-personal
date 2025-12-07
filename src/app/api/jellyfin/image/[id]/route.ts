import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = loadConfig();
    const jfConfig = requireConfig(
      getFirstEnabledWidgetConfig(config.widgets.jellyfin),
      "Jellyfin configuration missing"
    );

    if (!jfConfig.api_key || !jfConfig.url) {
      throw new ApiError(
        "Jellyfin configuration incomplete",
        500,
        ApiErrorCode.MISSING_CONFIG
      );
    }

    const { url, api_key } = jfConfig;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "Primary";

    // Construct Jellyfin Image URL
    const imageUrl = `${url}/Items/${id}/Images/${type}`;

    const response = await fetch(imageUrl, {
      headers: {
        "X-Emby-Token": api_key,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        "Image not found",
        response.status,
        ApiErrorCode.NOT_FOUND
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return new NextResponse(error.message, { status: error.statusCode });
    }
    console.error("Jellyfin Image Proxy Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import md5 from "crypto-js/md5";

function buildAuthParams(user: string, password: string): string {
  const salt = Math.random().toString(36).substring(7);
  const authToken = md5(password + salt).toString();

  const params = new URLSearchParams({
    u: user,
    t: authToken,
    s: salt,
    v: "1.16.1",
    c: "personal-dashboard",
  });

  return params.toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = loadConfig();
    const navidromeConfig = requireConfig(
      getFirstEnabledWidgetConfig(config.widgets.navidrome),
      "Navidrome configuration missing"
    );

    if (!navidromeConfig.url || !navidromeConfig.user || !navidromeConfig.password) {
      throw new ApiError(
        "Navidrome configuration incomplete",
        500,
        ApiErrorCode.MISSING_CONFIG
      );
    }

    const { url, user, password } = navidromeConfig;
    const baseUrl = url.replace(/\/$/, "");
    const authParams = buildAuthParams(user, password);

    const queryParams = new URLSearchParams(authParams);
    queryParams.set("id", id); // Cover Art ID

    const imageUrl = `${baseUrl}/rest/getCoverArt?${queryParams.toString()}`;

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new ApiError(
        "Failed to fetch image",
        response.status,
        ApiErrorCode.UPSTREAM_ERROR
      );
    }

    const contentType = response.headers.get("content-type");

    if (!contentType?.startsWith("image/")) {
      console.warn("Navidrome Proxy Warning: Response may not be an image", contentType);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return new NextResponse(error.message, { status: error.statusCode });
    }
    console.error("Navidrome Image Proxy Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


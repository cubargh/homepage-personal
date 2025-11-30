import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const config = loadConfig();
  const jfConfig = config.widgets.jellyfin;

  if (!jfConfig?.enabled || !jfConfig.api_key || !jfConfig.url) {
    return new NextResponse("Config missing", { status: 500 });
  }

  const { url, api_key } = jfConfig;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "Primary";

  // Construct Jellyfin Image URL
  // /Items/{Id}/Images/{Type}
  const imageUrl = `${url}/Items/${id}/Images/${type}`;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "X-Emby-Token": api_key,
      },
    });

    if (!response.ok) {
      return new NextResponse("Image not found", { status: response.status });
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
    console.error("Jellyfin Image Proxy Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


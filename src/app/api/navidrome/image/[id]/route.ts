import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import md5 from "crypto-js/md5";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = loadConfig();
  const navidromeConfig = config.widgets.navidrome;
  const { id } = await params;

  if (
    !navidromeConfig?.enabled ||
    !navidromeConfig.url ||
    !navidromeConfig.user ||
    !navidromeConfig.password
  ) {
    return new NextResponse("Navidrome configuration missing", { status: 500 });
  }

  const { url, user, password } = navidromeConfig;
  
  const baseUrl = url.replace(/\/$/, "");
  const salt = Math.random().toString(36).substring(7);
  const authToken = md5(password + salt).toString();
  
  const queryParams = new URLSearchParams({
    u: user,
    t: authToken,
    s: salt,
    v: "1.16.1",
    c: "personal-dashboard",
    id: id // Cover Art ID - in Navidrome this is usually e.g. "mf-..."
  });

  // Important: Navidrome sometimes uses "id" or "coverArt" depending on context. 
  // Subsonic 'getCoverArt' expects 'id'.
  // The ID from nowPlaying.coverArt might be "mf-xxxx". 
  // Check if the ID needs to be passed differently.
  // The logs showed "coverArt: 'mf-XYqCWQT755nJNw7pSP0Qqy_69250e9a'"
  // This should be the correct ID to pass to getCoverArt.

  const imageUrl = `${baseUrl}/rest/getCoverArt?${queryParams.toString()}`;
  
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Navidrome Proxy Error: Upstream ${response.status} ${response.statusText}`);
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    
    if (!contentType?.startsWith("image/")) {
       console.error("Navidrome Proxy Error: Response is not an image", contentType);
       // Still return it, maybe it's a weird mime type, but log it
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
    console.error("Navidrome Image Proxy Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


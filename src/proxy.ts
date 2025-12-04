import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";
import { loadConfig } from "@/lib/config";

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that don't require authentication
  const publicPaths = [
    "/login", 
    "/api/auth/login", 
    "/icon.svg",
    "/f1-circuits.geojson" 
  ];
  
  // Check if the path is public or a static asset
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p));
  const isStaticAsset = path.startsWith("/_next") || path.startsWith("/static") || path.includes(".");

  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }

  // Check if authentication is enabled
  try {
    const config = loadConfig();
    // If auth.enabled is explicitly false, skip authentication
    if (config.server.auth.enabled === false) {
      return NextResponse.next();
    }
    // If auth.enabled is not set, default to true for backward compatibility
  } catch (error) {
    // If config fails to load, default to requiring auth for security
    console.error("Failed to load config in proxy:", error);
  }

  // Check for session cookie
  const cookie = request.cookies.get("session");
  const session = cookie?.value ? await decrypt(cookie.value) : null;

  if (!session) {
    // For API routes, return 401 instead of redirecting
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login if no valid session (for non-API routes)
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};



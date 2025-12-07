import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";
import { loadConfig } from "@/lib/config";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();

  // If authentication is disabled, return error
  if (config.server.auth.enabled === false) {
    throw new ApiError(
      "Authentication is disabled",
      400,
      ApiErrorCode.BAD_REQUEST
    );
  }

  let body: { passphrase?: string };
  try {
    body = await request.json();
  } catch (error) {
    throw new ApiError(
      "Invalid request body",
      400,
      ApiErrorCode.VALIDATION_ERROR
    );
  }

  const { passphrase } = body;

  if (!passphrase) {
    throw new ApiError("Passphrase is required", 400, ApiErrorCode.VALIDATION_ERROR);
  }

  const envPassphrase = config.server.auth.passphrase;

  if (passphrase !== envPassphrase) {
    throw new ApiError("Invalid passphrase", 401, ApiErrorCode.UNAUTHORIZED);
  }

  const days = config.server.auth.session_days || 7;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Create session
  const session = await encrypt({
    user: "admin",
    expires,
    authenticated: true,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
});



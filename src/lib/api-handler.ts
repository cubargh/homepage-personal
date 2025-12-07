import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError, ApiErrorCode } from "./api-error";

// Next.js 16 route handler signature
type RouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function requireQueryParam(
  request: NextRequest,
  paramName: string
): string {
  const value = request.nextUrl.searchParams.get(paramName);
  if (!value) {
    throw new ApiError(
      `${paramName} is required`,
      400,
      ApiErrorCode.BAD_REQUEST
    );
  }
  return value;
}

export function requireConfig<T>(
  config: T | undefined,
  errorMessage: string
): T {
  if (!config) {
    throw new ApiError(
      errorMessage,
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }
  return config;
}


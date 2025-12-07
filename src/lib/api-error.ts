import { NextResponse } from "next/server";

export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UPSTREAM_ERROR = "UPSTREAM_ERROR",
  TIMEOUT = "TIMEOUT",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  
  // Configuration errors
  CONFIG_ERROR = "CONFIG_ERROR",
  MISSING_CONFIG = "MISSING_CONFIG",
}

export interface ApiErrorResponse {
  error: string;
  code?: ApiErrorCode;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: ApiErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        details: this.details,
      },
      { status: this.statusCode }
    );
  }
}

export function createErrorResponse(
  error: unknown,
  defaultMessage = "Internal server error"
): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || defaultMessage,
        code: ApiErrorCode.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: defaultMessage,
      code: ApiErrorCode.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error);
  return createErrorResponse(error);
}


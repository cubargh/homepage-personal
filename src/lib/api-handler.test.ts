import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  withErrorHandling,
  requireQueryParam,
  requireConfig,
} from "./api-handler";
import { ApiError, ApiErrorCode, handleApiError } from "./api-error";
import { NextRequest, NextResponse } from "next/server";

// Mock handleApiError
vi.mock("./api-error", async () => {
  const actual = await vi.importActual<typeof import("./api-error")>("./api-error");
  return {
    ...actual,
    handleApiError: vi.fn((error: unknown) => {
      if (error instanceof actual.ApiError) {
        return new Response(
          JSON.stringify({
            error: error.message,
            code: error.code,
          }),
          { status: error.statusCode }
        );
      }
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500 }
      );
    }),
  };
});

describe("withErrorHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully wrap handler and return result", async () => {
    const handler = vi.fn(async () => {
      return NextResponse.json({ success: true }, { status: 200 });
    });

    const wrappedHandler = withErrorHandling(handler);
    const request = new NextRequest("http://localhost:3000/api/test");

    const response = await wrappedHandler(request);
    const data = await response.json();

    expect(handler).toHaveBeenCalledWith(request, undefined);
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it("should catch errors and call handleApiError", async () => {
    const error = new Error("Test error");
    const handler = vi.fn(async () => {
      throw error;
    });

    const wrappedHandler = withErrorHandling(handler);
    const request = new NextRequest("http://localhost:3000/api/test");

    const response = await wrappedHandler(request);
    const data = await response.json();

    expect(handler).toHaveBeenCalled();
    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should preserve request and context parameters", async () => {
    const handler = vi.fn(async (req, context) => {
      return NextResponse.json(
        {
          url: req.url,
          params: context?.params ? await context.params : null,
        },
        { status: 200 }
      );
    });

    const wrappedHandler = withErrorHandling(handler);
    const request = new NextRequest("http://localhost:3000/api/test");
    const context = {
      params: Promise.resolve({ id: "123" }),
    };

    const response = await wrappedHandler(request, context);
    const data = await response.json();

    expect(handler).toHaveBeenCalledWith(request, context);
    expect(data.url).toBe("http://localhost:3000/api/test");
    expect(data.params).toEqual({ id: "123" });
  });

  it("should handle ApiError correctly", async () => {
    const apiError = new ApiError(
      "Bad request",
      400,
      ApiErrorCode.BAD_REQUEST
    );
    const handler = vi.fn(async () => {
      throw apiError;
    });

    const wrappedHandler = withErrorHandling(handler);
    const request = new NextRequest("http://localhost:3000/api/test");

    const response = await wrappedHandler(request);
    const data = await response.json();

    expect(handleApiError).toHaveBeenCalledWith(apiError);
    expect(response.status).toBe(400);
    expect(data.code).toBe(ApiErrorCode.BAD_REQUEST);
  });
});

describe("requireQueryParam", () => {
  it("should return value when param exists", () => {
    const request = new NextRequest(
      "http://localhost:3000/api/test?param=value"
    );

    const value = requireQueryParam(request, "param");

    expect(value).toBe("value");
  });

  it("should throw ApiError with BAD_REQUEST when param is missing", () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    expect(() => requireQueryParam(request, "missing")).toThrow(ApiError);
    expect(() => requireQueryParam(request, "missing")).toThrow(
      "missing is required"
    );
  });

  it("should handle empty string values", () => {
    const request = new NextRequest("http://localhost:3000/api/test?param=");

    // Empty string is falsy, so it should throw
    expect(() => requireQueryParam(request, "param")).toThrow(ApiError);
  });

  it("should handle multiple params", () => {
    const request = new NextRequest(
      "http://localhost:3000/api/test?param1=value1&param2=value2"
    );

    const value1 = requireQueryParam(request, "param1");
    const value2 = requireQueryParam(request, "param2");

    expect(value1).toBe("value1");
    expect(value2).toBe("value2");
  });

  it("should throw with correct error code", () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    try {
      requireQueryParam(request, "missing");
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ApiErrorCode.BAD_REQUEST);
      }
    }
  });
});

describe("requireConfig", () => {
  it("should return config when provided", () => {
    const config = { enabled: true, value: "test" };

    const result = requireConfig(config, "Config is missing");

    expect(result).toBe(config);
  });

  it("should throw ApiError with MISSING_CONFIG when config is undefined", () => {
    expect(() => requireConfig(undefined, "Config is missing")).toThrow(
      ApiError
    );
    expect(() => requireConfig(undefined, "Config is missing")).toThrow(
      "Config is missing"
    );
  });

  it("should throw ApiError with MISSING_CONFIG when config is null", () => {
    expect(() => requireConfig(null as any, "Config is missing")).toThrow(
      ApiError
    );
  });

  it("should throw with correct error code and status", () => {
    try {
      requireConfig(undefined, "Config is missing");
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ApiErrorCode.MISSING_CONFIG);
        expect(error.message).toBe("Config is missing");
      }
    }
  });

  it("should handle falsy but valid values", () => {
    const config = { enabled: false };

    const result = requireConfig(config, "Config is missing");

    expect(result).toBe(config);
  });

  it("should handle empty object", () => {
    const config = {};

    const result = requireConfig(config, "Config is missing");

    expect(result).toBe(config);
  });
});


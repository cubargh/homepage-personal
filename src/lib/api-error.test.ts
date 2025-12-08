import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApiError,
  ApiErrorCode,
  createErrorResponse,
  handleApiError,
} from "./api-error";

describe("ApiError", () => {
  it("should create ApiError with all parameters", () => {
    const error = new ApiError(
      "Test error",
      400,
      ApiErrorCode.BAD_REQUEST,
      { field: "test" }
    );

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ApiErrorCode.BAD_REQUEST);
    expect(error.details).toEqual({ field: "test" });
    expect(error.name).toBe("ApiError");
  });

  it("should create ApiError without optional parameters", () => {
    const error = new ApiError("Test error", 500);

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it("toResponse() should return correct NextResponse", async () => {
    const error = new ApiError(
      "Test error",
      400,
      ApiErrorCode.BAD_REQUEST,
      { field: "test" }
    );

    const response = error.toResponse();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Test error",
      code: ApiErrorCode.BAD_REQUEST,
      details: { field: "test" },
    });
  });

  it("toResponse() should handle missing optional fields", async () => {
    const error = new ApiError("Test error", 500);

    const response = error.toResponse();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Test error",
      code: undefined,
      details: undefined,
    });
  });
});

describe("createErrorResponse", () => {
  it("should handle ApiError instance", async () => {
    const apiError = new ApiError(
      "API Error",
      404,
      ApiErrorCode.NOT_FOUND
    );

    const response = createErrorResponse(apiError);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "API Error",
      code: ApiErrorCode.NOT_FOUND,
      details: undefined,
    });
  });

  it("should handle generic Error instance", async () => {
    const error = new Error("Generic error");

    const response = createErrorResponse(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Generic error",
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  });

  it("should handle Error with empty message", async () => {
    const error = new Error("");

    const response = createErrorResponse(error, "Default message");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Default message",
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  });

  it("should handle unknown error type", async () => {
    const unknownError = "String error";

    const response = createErrorResponse(unknownError);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Internal server error",
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  });

  it("should use custom default message", async () => {
    const unknownError = null;

    const response = createErrorResponse(unknownError, "Custom default");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Custom default",
      code: ApiErrorCode.INTERNAL_ERROR,
    });
  });

  it("should handle null error", async () => {
    const response = createErrorResponse(null);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});

describe("handleApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call createErrorResponse and log error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Test error");

    const response = handleApiError(error);
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalledWith("API Error:", error);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Test error");

    consoleSpy.mockRestore();
  });

  it("should handle ApiError correctly", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const apiError = new ApiError(
      "API Error",
      400,
      ApiErrorCode.BAD_REQUEST
    );

    const response = handleApiError(apiError);
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalledWith("API Error:", apiError);
    expect(response.status).toBe(400);
    expect(data.code).toBe(ApiErrorCode.BAD_REQUEST);

    consoleSpy.mockRestore();
  });
});


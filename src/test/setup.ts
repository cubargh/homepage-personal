import "@testing-library/jest-dom";
import { vi } from "vitest";

// Set NODE_ENV to test (prevents cache cleanup interval from running)
vi.stubEnv("NODE_ENV", "test");

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    nextUrl: URL;
    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
    },
  },
}));

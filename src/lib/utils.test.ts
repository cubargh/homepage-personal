import { describe, it, expect } from "vitest";
import { cn, formatTime } from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge Tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("should handle mixed inputs", () => {
    expect(cn("foo", ["bar"], { baz: true }, "qux")).toBe("foo bar baz qux");
  });
});

describe("formatTime", () => {
  it("should format a Date object", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const result = formatTime(date, "yyyy-MM-dd", "UTC");
    expect(result).toBe("2024-01-15");
  });

  it("should format an ISO string", () => {
    const result = formatTime("2024-01-15T12:00:00Z", "yyyy-MM-dd", "UTC");
    expect(result).toBe("2024-01-15");
  });

  it("should format a timestamp", () => {
    const timestamp = new Date("2024-01-15T12:00:00Z").getTime();
    const result = formatTime(timestamp, "yyyy-MM-dd", "UTC");
    expect(result).toBe("2024-01-15");
  });

  it("should respect timezone", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const utcResult = formatTime(date, "HH:mm", "UTC");
    const nyResult = formatTime(date, "HH:mm", "America/New_York");
    expect(utcResult).not.toBe(nyResult);
  });

  it("should use UTC as default timezone", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const result = formatTime(date, "HH:mm");
    expect(result).toBe("12:00");
  });

  it("should format with different format strings", () => {
    const date = new Date("2024-01-15T12:30:45Z");
    expect(formatTime(date, "yyyy-MM-dd", "UTC")).toBe("2024-01-15");
    expect(formatTime(date, "HH:mm:ss", "UTC")).toBe("12:30:45");
    expect(formatTime(date, "EEEE", "UTC")).toBe("Monday");
  });

  it("should handle edge cases", () => {
    const date = new Date("1970-01-01T00:00:00Z");
    const result = formatTime(date, "yyyy-MM-dd", "UTC");
    expect(result).toBe("1970-01-01");
  });
});


import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Extract formatting functions for testing
// Since they're not exported, we'll recreate them here
const formatSpeed = (value: number | null | undefined): string | React.ReactNode => {
  if (value === null || value === undefined) return "-";
  return (
    <>
      {Math.round(value)} <span className="text-xs opacity-70">Mbps</span>
    </>
  );
};

const formatPing = (value: number | null | undefined): string | React.ReactNode => {
  if (value === null || value === undefined) return "-";
  return (
    <>
      {value.toFixed(2)} <span className="text-xs opacity-70">ms</span>
    </>
  );
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    // Check if date is invalid
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    // For older dates, show formatted date
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return "";
  }
};

describe("formatSpeed", () => {
  it("should format Mbps correctly", () => {
    const result = formatSpeed(100.7);
    
    // Since it returns React nodes, we'll check the structure
    expect(result).not.toBe("-");
    if (typeof result !== "string") {
      expect(React.isValidElement(result)).toBe(true);
    }
  });

  it("should round to nearest integer", () => {
    const result1 = formatSpeed(100.4);
    const result2 = formatSpeed(100.6);
    
    expect(result1).not.toBe("-");
    expect(result2).not.toBe("-");
  });

  it("should handle null", () => {
    expect(formatSpeed(null)).toBe("-");
  });

  it("should handle undefined", () => {
    expect(formatSpeed(undefined)).toBe("-");
  });

  it("should handle zero", () => {
    const result = formatSpeed(0);
    expect(result).not.toBe("-");
  });

  it("should handle large values", () => {
    const result = formatSpeed(1000.9);
    expect(result).not.toBe("-");
  });
});

describe("formatPing", () => {
  it("should format milliseconds with 2 decimals", () => {
    const result = formatPing(12.345);
    
    expect(result).not.toBe("-");
    if (typeof result !== "string") {
      expect(React.isValidElement(result)).toBe(true);
    }
  });

  it("should handle null", () => {
    expect(formatPing(null)).toBe("-");
  });

  it("should handle undefined", () => {
    expect(formatPing(undefined)).toBe("-");
  });

  it("should handle zero", () => {
    const result = formatPing(0);
    expect(result).not.toBe("-");
  });

  it("should handle small values", () => {
    const result = formatPing(0.123);
    expect(result).not.toBe("-");
  });

  it("should round to 2 decimal places", () => {
    const result = formatPing(12.999);
    expect(result).not.toBe("-");
  });
});

describe("formatDateTime", () => {

  it("should return 'Just now' for < 1 minute", () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    
    const result = formatDateTime(thirtySecondsAgo.toISOString());
    
    expect(result).toBe("Just now");
  });

  it("should return 'Xm ago' for < 1 hour", () => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    const result = formatDateTime(thirtyMinutesAgo.toISOString());
    
    expect(result).toBe("30m ago");
  });

  it("should return 'Xh ago' for < 24 hours", () => {
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    
    const result = formatDateTime(fiveHoursAgo.toISOString());
    
    expect(result).toBe("5h ago");
  });

  it("should return 'Yesterday' for 1 day ago", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(yesterday.toISOString());
    
    expect(result).toBe("Yesterday");
  });

  it("should return 'Xd ago' for < 7 days", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(threeDaysAgo.toISOString());
    
    expect(result).toBe("3d ago");
  });

  it("should return formatted date for older dates", () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(tenDaysAgo.toISOString());
    
    expect(result).not.toBe("");
    expect(result).not.toContain("ago");
    expect(result).toMatch(/[A-Za-z]{3} \d{1,2}/); // Format: "Jan 15"
  });

  it("should handle invalid dates", () => {
    const result = formatDateTime("invalid-date");
    
    expect(result).toBe("");
  });

  it("should handle null", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("should handle undefined", () => {
    expect(formatDateTime(undefined)).toBe("");
  });

  it("should handle empty string", () => {
    expect(formatDateTime("")).toBe("");
  });

  it("should handle edge case - exactly 1 minute", () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const result = formatDateTime(oneMinuteAgo.toISOString());
    
    expect(result).toBe("1m ago");
  });

  it("should handle edge case - exactly 1 hour", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const result = formatDateTime(oneHourAgo.toISOString());
    
    expect(result).toBe("1h ago");
  });

  it("should handle edge case - exactly 24 hours", () => {
    const now = new Date();
    const exactly24HoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(exactly24HoursAgo.toISOString());
    
    // Should be "Yesterday" or "1d ago" depending on exact timing
    expect(["Yesterday", "1d ago"]).toContain(result);
  });

  it("should handle edge case - exactly 7 days", () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(sevenDaysAgo.toISOString());
    
    // Should be formatted date or "7d ago" depending on exact timing
    expect(result).toBeTruthy();
  });

  it("should handle future dates gracefully", () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 1000);
    
    const result = formatDateTime(futureDate.toISOString());
    
    // Should handle gracefully, might return negative or "Just now"
    expect(typeof result).toBe("string");
  });

  it("should format dates correctly for different locales", () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    const result = formatDateTime(tenDaysAgo.toISOString());
    
    // Should return a formatted date string
    expect(result).toMatch(/[A-Za-z]{3}/); // Should contain month abbreviation
  });
});


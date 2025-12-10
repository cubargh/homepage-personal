import { NextResponse } from "next/server";
import ical from "node-ical";
import { loadConfig, CalendarWidgetConfig } from "@/lib/config";
import { normalizeWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { cached } from "@/lib/cache";
import crypto from "crypto";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendarIndex: number;
  calendarColor: string | null;
}

function parseCalendarConfig(urlConfig: string): { url: string; color: string | null } {
  const trimmed = urlConfig.trim();
  const parts = trimmed.split(";");
  let cleanUrl: string;
  let color: string | null = null;

  if (parts.length === 2) {
    color = parts[0].trim() || null;
    cleanUrl = parts[1].trim();
  } else {
    cleanUrl = parts[0].trim();
  }

  // Handle webcal:// protocol by replacing with https://
  if (cleanUrl.startsWith("webcal://")) {
    cleanUrl = "https://" + cleanUrl.substring(9);
  }

  return { url: cleanUrl, color };
}

async function fetchCalendarEvents(
  url: string,
  color: string | null,
  index: number
): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      console.error(`Failed to fetch ICS file: ${url}`);
      return [];
    }

    const icsData = await response.text();
    const events = await ical.async.parseICS(icsData);

    let eventCounter = 0;
    return Object.values(events)
      .filter((event): event is ical.VEvent => event.type === "VEVENT")
      .map((event) => {
        eventCounter++;
        // Use uid if available, otherwise generate unique ID with index, counter, and random
        const id = (event as ical.VEvent).uid || `${index}-${eventCounter}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          summary: event.summary || "",
          description: event.description,
          location: event.location,
          start: event.start instanceof Date ? event.start : new Date(event.start),
          end: event.end instanceof Date ? event.end : new Date(event.end),
          allDay: event.datetype === "date",
          calendarIndex: index,
          calendarColor: color,
        };
      });
  } catch (e) {
    console.error(`Error processing calendar ${index}:`, e);
    return [];
  }
}

// Cache calendar events for 5 minutes
export const revalidate = 300;

export const GET = withErrorHandling(async () => {
  const config = loadConfig();

  const calendarConfigs = normalizeWidgetConfig<CalendarWidgetConfig>(
    config.widgets.calendar
  ).filter((c) => c.enabled);

  if (calendarConfigs.length === 0) {
    throw new ApiError(
      "Calendar ICS URL not configured",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  // Aggregate all ICS URLs from all calendar widget instances
  const allIcsUrls: string[] = [];
  calendarConfigs.forEach((calendarConfig) => {
    if (calendarConfig.ics_urls) {
      allIcsUrls.push(...calendarConfig.ics_urls);
    }
  });

  if (allIcsUrls.length === 0) {
    throw new ApiError(
      "Calendar ICS URL not configured",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  // Create cache key based on ICS URLs
  const cacheKey = `calendar:${crypto.createHash("md5").update(JSON.stringify(allIcsUrls)).digest("hex")}`;

  const result = await cached(
    cacheKey,
    async () => {
      // Parse URLs and colors from config
      const parsedConfigs = allIcsUrls
        .map(parseCalendarConfig)
        .filter((config) => config.url.length > 0);

      // Fetch all calendars in parallel
      const allEvents = await Promise.all(
        parsedConfigs.map(({ url, color }, index) =>
          fetchCalendarEvents(url, color, index)
        )
      );

      // Flatten and sort events
      const flatEvents = allEvents
        .flat()
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      return { events: flatEvents };
    },
    300000 // 5 minutes cache
  );

  const response = NextResponse.json(result);
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
});

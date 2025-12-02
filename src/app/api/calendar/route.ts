import { NextResponse } from "next/server";
import ical from "node-ical";
import { loadConfig, CalendarWidgetConfig } from "@/lib/config";
import { normalizeWidgetConfig } from "@/lib/widget-config-utils";

export async function GET() {
  const config = loadConfig();
  
  // Handle both single config and array of configs
  const calendarConfigs = normalizeWidgetConfig<CalendarWidgetConfig>(
    config.widgets.calendar
  ).filter((c) => c.enabled);

  if (calendarConfigs.length === 0) {
    return NextResponse.json({ error: "Calendar ICS URL not configured" }, { status: 500 });
  }

  try {
    // Aggregate all ICS URLs from all calendar widget instances
    const allIcsUrls: string[] = [];
    calendarConfigs.forEach((calendarConfig) => {
      if (calendarConfig.ics_urls) {
        allIcsUrls.push(...calendarConfig.ics_urls);
      }
    });

    if (allIcsUrls.length === 0) {
      return NextResponse.json({ error: "Calendar ICS URL not configured" }, { status: 500 });
    }

    // Parse URLs and colors from config (format: "url" or "hexcolor;url")
    const parsedConfigs = allIcsUrls.map((urlConfig) => {
      const trimmed = urlConfig.trim();
      const parts = trimmed.split(';');
      let cleanUrl: string;
      let color: string | null = null;
      
      if (parts.length === 2) {
        // Format: "hexcolor;url"
        color = parts[0].trim() || null;
        cleanUrl = parts[1].trim();
      } else {
        // Format: "url" (no color)
        cleanUrl = parts[0].trim();
      }
      
      // Handle webcal:// protocol by replacing with https://
      if (cleanUrl.startsWith('webcal://')) {
        cleanUrl = 'https://' + cleanUrl.substring(9);
      }
      
      return { url: cleanUrl, color };
    }).filter(config => config.url.length > 0);
    
    const allEvents = await Promise.all(parsedConfigs.map(async ({ url, color }, index) => {
        try {
            const response = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 minutes
            if (!response.ok) {
                console.error(`Failed to fetch ICS file: ${url}`);
                return [];
            }
            const icsData = await response.text();
            const events = await ical.async.parseICS(icsData);

            return Object.values(events)
                .filter((event: any) => event.type === 'VEVENT')
                .map((event: any) => ({
                    id: event.uid,
                    summary: event.summary,
                    description: event.description,
                    location: event.location,
                    start: event.start,
                    end: event.end,
                    allDay: event.datetype === 'date', 
                    calendarIndex: index, // Assign index for coloring
                    calendarColor: color // Custom color from config
                }));
        } catch (e) {
            console.error(`Error processing calendar ${index}:`, e);
            return [];
        }
    }));

    // Flatten array of arrays
    const flatEvents = allEvents.flat().sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events: flatEvents });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ error: `Failed to fetch calendar data: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import ical from "node-ical";
import { loadConfig } from "@/lib/config";

export async function GET() {
  const config = loadConfig();
  const icsUrlsConfig = config.widgets.calendar.ics_urls;

  if (!icsUrlsConfig || icsUrlsConfig.length === 0) {
    return NextResponse.json({ error: "Calendar ICS URL not configured" }, { status: 500 });
  }

  try {
    // Handle webcal:// protocol by replacing with https://
    const urls = icsUrlsConfig.map(url => {
        let cleanUrl = url.trim();
        if (cleanUrl.startsWith('webcal://')) {
            cleanUrl = 'https://' + cleanUrl.substring(9);
        }
        return cleanUrl;
    }).filter(url => url.length > 0);
    
    const allEvents = await Promise.all(urls.map(async (url, index) => {
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
                    calendarIndex: index // Assign index for coloring
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

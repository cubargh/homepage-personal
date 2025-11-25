import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = "https://api.football-data.org/v4";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "matches";
  
  if (!API_KEY) {
     return NextResponse.json({ error: "API Configuration Missing" }, { status: 500 });
  }

  // If the frontend requests matches, we enforce our specific filters for security/simplicity
  if (endpoint === "matches") {
      const competitions = "PL,PD,BL1,SA,CL,EL"; 
      // Use dateFrom and dateTo to get a wider range of matches instead of just "SCHEDULED" which defaults to a short window
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 6); // Look ahead 6 days (API limit is 10 days)

      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = nextWeek.toISOString().split('T')[0];

      const url = `${BASE_URL}/matches?competitions=${competitions}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=20`;
      
      try {
        const response = await fetch(url, {
            headers: {
                "X-Auth-Token": API_KEY,
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });
        
        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error: "Upstream Error", details: error }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
      }
  }

  return NextResponse.json({ error: "Invalid Endpoint" }, { status: 400 });
}

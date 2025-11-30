import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const jfConfig = config.widgets.jellyfin;

  if (!jfConfig?.enabled || !jfConfig.api_key || !jfConfig.url) {
    return NextResponse.json(
      { error: "Jellyfin configuration missing or disabled" },
      { status: 500 }
    );
  }

  const { url, api_key, user_name } = jfConfig;
  const headers = {
    "X-Emby-Token": api_key,
    "Content-Type": "application/json",
  };

  try {
    // 1. Fetch Stats (Global)
    const statsRes = await fetch(`${url}/Items/Counts`, { headers });
    const stats = statsRes.ok ? await statsRes.json() : null;

    // 2. Fetch User ID (if username provided)
    let userId = "";
    if (user_name) {
      const usersRes = await fetch(`${url}/Users`, { headers });
      if (usersRes.ok) {
        const users = await usersRes.json();
        const user = users.find(
          (u: any) => u.Name.toLowerCase() === user_name.toLowerCase()
        );
        if (user) userId = user.Id;
      }
    }

    // 3. Fetch Latest Media
    let latestMovies = [];
    let latestShows = [];

    if (userId) {
      const [moviesRes, showsRes] = await Promise.all([
        fetch(
          `${url}/Users/${userId}/Items?IncludeItemTypes=Movie&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=3&Fields=PrimaryImageAspectRatio,DateCreated`,
          { headers }
        ),
        fetch(
          `${url}/Users/${userId}/Items?IncludeItemTypes=Series&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=3&Fields=PrimaryImageAspectRatio,DateCreated`,
          { headers }
        ),
      ]);

      if (moviesRes.ok) {
        const data = await moviesRes.json();
        latestMovies = data.Items;
      }
      if (showsRes.ok) {
        const data = await showsRes.json();
        latestShows = data.Items;
      }
    }

    return NextResponse.json({
      stats: {
        MovieCount: stats?.MovieCount || 0,
        SeriesCount: stats?.SeriesCount || 0,
        EpisodeCount: stats?.EpisodeCount || 0,
        // Removed SongCount as requested
      },
      latestMovies,
      latestShows,
    });
  } catch (error) {
    console.error("Jellyfin API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jellyfin data" },
      { status: 500 }
    );
  }
}


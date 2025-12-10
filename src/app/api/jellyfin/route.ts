import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { cached } from "@/lib/cache";

interface JellyfinUser {
  Id: string;
  Name: string;
}

interface JellyfinUsersResponse {
  Items?: JellyfinUser[];
}

interface JellyfinStats {
  MovieCount?: number;
  SeriesCount?: number;
  EpisodeCount?: number;
}

interface JellyfinItem {
  Id: string;
  Name: string;
  DateCreated?: string;
  ImageTags?: {
    Primary?: string;
  };
}

interface JellyfinItemsResponse {
  Items?: JellyfinItem[];
}

// Cache Jellyfin data for 5 minutes
export const revalidate = 300;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const jfConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.jellyfin),
    "Jellyfin configuration missing or disabled"
  );

  if (!jfConfig.api_key || !jfConfig.url) {
    throw new ApiError(
      "Jellyfin configuration incomplete",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, api_key, user_name } = jfConfig;
  const baseUrl = url.replace(/\/$/, "");
  
  // Create cache key based on config
  const cacheKey = `jellyfin:${baseUrl}:${user_name || "default"}`;

  const result = await cached(
    cacheKey,
    async () => {
      const headers = {
        "X-Emby-Token": api_key,
        "Content-Type": "application/json",
      };

      // 1. Fetch Stats (Global)
      const statsRes = await fetch(`${baseUrl}/Items/Counts`, { 
        headers,
        next: { revalidate: 300 } // Cache upstream fetch
      });
      let stats: JellyfinStats | null = null;
      if (statsRes.ok) {
        try {
          stats = (await statsRes.json()) as JellyfinStats;
        } catch (error) {
          console.warn("Failed to parse Jellyfin stats:", error);
        }
      }

      // 2. Fetch User ID (if username provided)
      let userId = "";
      if (user_name) {
        const usersRes = await fetch(`${baseUrl}/Users`, { 
          headers,
          next: { revalidate: 3600 } // Cache user lookup for 1 hour
        });
        if (usersRes.ok) {
          try {
            const usersData = (await usersRes.json()) as JellyfinUsersResponse;
            const users = usersData.Items || [];
            const user = users.find(
              (u) => u.Name.toLowerCase() === user_name.toLowerCase()
            );
            if (user) userId = user.Id;
          } catch (error) {
            console.warn("Failed to parse Jellyfin users:", error);
          }
        }
      }

      // 3. Fetch Latest Media
      let latestMovies: JellyfinItem[] = [];
      let latestShows: JellyfinItem[] = [];

      if (userId) {
        const [moviesRes, showsRes] = await Promise.all([
          fetch(
            `${baseUrl}/Users/${userId}/Items?IncludeItemTypes=Movie&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=3&Fields=PrimaryImageAspectRatio,DateCreated`,
            { 
              headers,
              next: { revalidate: 300 } // Cache upstream fetch
            }
          ),
          fetch(
            `${baseUrl}/Users/${userId}/Items?IncludeItemTypes=Series&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=3&Fields=PrimaryImageAspectRatio,DateCreated`,
            { 
              headers,
              next: { revalidate: 300 } // Cache upstream fetch
            }
          ),
        ]);

        if (moviesRes.ok) {
          try {
            const data = (await moviesRes.json()) as JellyfinItemsResponse;
            latestMovies = data.Items || [];
          } catch (error) {
            console.warn("Failed to parse Jellyfin movies:", error);
          }
        }
        if (showsRes.ok) {
          try {
            const data = (await showsRes.json()) as JellyfinItemsResponse;
            latestShows = data.Items || [];
          } catch (error) {
            console.warn("Failed to parse Jellyfin shows:", error);
          }
        }
      }

      return {
        stats: {
          MovieCount: stats?.MovieCount || 0,
          SeriesCount: stats?.SeriesCount || 0,
          EpisodeCount: stats?.EpisodeCount || 0,
        },
        latestMovies,
        latestShows,
      };
    },
    300000 // 5 minutes cache
  );

  const response = NextResponse.json(result);
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
});


import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { cached } from "@/lib/cache";
import md5 from "crypto-js/md5";

function buildAuthParams(user: string, password: string): string {
  const salt = Math.random().toString(36).substring(7);
  const authToken = md5(password + salt).toString();
  
  const params = new URLSearchParams({
    u: user,
    t: authToken,
    s: salt,
    v: "1.16.1",
    c: "personal-dashboard",
    f: "json",
  });
  
  return params.toString();
}

async function getArtistCount(baseUrl: string, user: string, queryString: string): Promise<number> {
  // Cache artist count for 1 hour since it's expensive to fetch
  // Use stable cache key based on baseUrl and user, not queryString (which changes every request)
  const cacheKey = `navidrome:artistCount:${baseUrl}:${user}`;
  
  return cached(
    cacheKey,
    async () => {
      const artistsUrl = `${baseUrl}/rest/getArtists?${queryString}`;
      const artistsRes = await fetch(artistsUrl);
      
      if (!artistsRes.ok) {
        // If fetch fails, return 0 rather than throwing
        // Log for debugging but don't throw to avoid breaking the widget
        console.warn(`Failed to fetch artist count from Navidrome: ${artistsRes.status}`);
        return 0;
      }
      
      const artistsData = await artistsRes.json();
      let artistCount = 0;
      const index = artistsData["subsonic-response"]?.artists?.index;
      
      if (Array.isArray(index)) {
        index.forEach((idx: { artist?: unknown[] }) => {
          if (Array.isArray(idx.artist)) {
            artistCount += idx.artist.length;
          }
        });
      }
      
      return artistCount;
    },
    3600000 // 1 hour cache
  );
}

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const navidromeConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.navidrome),
    "Navidrome configuration missing or disabled"
  );

  if (!navidromeConfig.url || !navidromeConfig.user || !navidromeConfig.password) {
    throw new ApiError(
      "Navidrome configuration incomplete",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, user, password } = navidromeConfig;
  const baseUrl = url.replace(/\/$/, "");
  const queryString = buildAuthParams(user, password);

  // Fetch now playing and scan status in parallel
  const [nowPlayingRes, scanRes] = await Promise.all([
    fetch(`${baseUrl}/rest/getNowPlaying?${queryString}`),
    fetch(`${baseUrl}/rest/getScanStatus?${queryString}`),
  ]);

  if (!nowPlayingRes.ok || !scanRes.ok) {
    throw new ApiError(
      "Failed to fetch Navidrome data",
      502,
      ApiErrorCode.UPSTREAM_ERROR
    );
  }

  interface SubsonicResponse {
    "subsonic-response"?: {
      nowPlaying?: {
        entry?: Array<{
          id: string;
          title: string;
          artist: string;
          album: string;
          coverArt?: string;
          duration: number;
          minutesAgo: number;
          username: string;
        }>;
      };
      scanStatus?: {
        scanning?: boolean;
        count?: number;
      };
    };
  }

  let nowPlayingData: SubsonicResponse;
  let scanData: SubsonicResponse;

  try {
    [nowPlayingData, scanData] = await Promise.all([
      nowPlayingRes.json(),
      scanRes.json(),
    ]);
  } catch (error) {
    throw new ApiError(
      "Failed to parse Navidrome API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  const nowPlaying = nowPlayingData["subsonic-response"]?.nowPlaying?.entry?.[0];
  
  // Get artist count with caching (this is expensive, so cache it)
  const artistCount = await getArtistCount(baseUrl, user, queryString);

  return NextResponse.json({
    scanStatus: {
      ...scanData["subsonic-response"]?.scanStatus,
      artistCount,
    },
    nowPlaying: nowPlaying
      ? {
          id: nowPlaying.id,
          title: nowPlaying.title,
          artist: nowPlaying.artist,
          album: nowPlaying.album,
          coverArt: nowPlaying.coverArt,
          duration: nowPlaying.duration,
          minutesAgo: nowPlaying.minutesAgo,
          player: nowPlaying.username,
        }
      : null,
  });
});


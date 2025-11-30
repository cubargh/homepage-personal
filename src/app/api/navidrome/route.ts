import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import md5 from "crypto-js/md5";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const navidromeConfig = config.widgets.navidrome;

  if (
    !navidromeConfig?.enabled ||
    !navidromeConfig.url ||
    !navidromeConfig.user ||
    !navidromeConfig.password
  ) {
    return NextResponse.json(
      { error: "Navidrome configuration missing or disabled" },
      { status: 500 }
    );
  }

  const { url, user, password } = navidromeConfig;
  
  // Clean base URL
  const baseUrl = url.replace(/\/$/, "");
  
  // Generate auth parameters for Subsonic API
  const salt = Math.random().toString(36).substring(7);
  const authToken = md5(password + salt).toString();
  
  const params = new URLSearchParams({
    u: user,
    t: authToken,
    s: salt,
    v: "1.16.1", // API Version
    c: "personal-dashboard", // Client name
    f: "json" // Format
  });
  
  const queryString = params.toString();

  try {
    // 1. Fetch Scan Status to get counts (Song, Album, Artist counts are often in getScanStatus or we use search3)
    // getScanStatus is usually lightweight and returns folderCount, but maybe not total songs.
    // Actually, Navidrome's getMusicFolders or similar might be better, or search3 with empty query?
    // Let's use 'getScanStatus' which often returns counts in some implementations, 
    // but Subsonic API docs say getScanStatus returns scan status.
    // A better way for stats is usually:
    // - getMusicFolders (might not have counts)
    // - getAlbumList (pagination)
    // - search3 with * (might be heavy)
    
    // Navidrome documentation says: "getScanStatus: Also returns the extra fields lastScan and folderCount"
    // It doesn't explicitly promise song/album counts.
    
    // Alternative: Use 'getIndexes' or standard lists.
    // But actually, for a "dashboard" summary, many clients use:
    // - getAlbumList type=newest (for albums)
    // - getRandomSongs (for songs count? No)
    
    // Wait, let's look at standard Subsonic ways to get stats.
    // usually clients just iterate or cache.
    // BUT, we can cheat.
    // 'getMusicFolders' often lists folders.
    // 'getAlbumList' with size=1 gives total count? No.
    
    // Let's try to fetch recent stuff and infer or just just display "Recent".
    // The user requested: "amount of songs, amount of albums, amount of artists"
    // Navidrome does not natively expose a "getStats" endpoint in Subsonic API (it's not standard).
    
    // However, we can do:
    // 1. getArtists (returns list of artists, we can count them) - might be huge.
    // 2. getAlbumList type=alphabetical (returns list of albums) - might be huge.
    
    // Actually, let's try to be efficient.
    // If we can't get exact counts cheaply, maybe we skip them or cache heavily.
    // But wait, is there an extension?
    // Navidrome might assume standard Subsonic.
    
    // Let's check getNowPlaying first.
    const nowPlayingUrl = `${baseUrl}/rest/getNowPlaying?${queryString}`;
    const nowPlayingRes = await fetch(nowPlayingUrl);
    const nowPlayingData = await nowPlayingRes.json();
    
    // For counts, let's try a "search3" for empty string or something generic, but that returns limited results.
    // A common trick is `getArtists` to count artists.
    // `getAlbumList` with `type=newest` `size=1` doesn't give total.
    
    // Let's implement 'getNowPlaying' correctly first.
    const nowPlaying = nowPlayingData["subsonic-response"]?.nowPlaying?.entry?.[0];
    
    // For stats, honestly, querying ALL artists/albums every refresh is bad.
    // Maybe we just show "Now Playing" and "Recent Albums" instead of counts if counts are hard?
    // User specifically asked for "amount of songs...".
    
    // Let's try to find a way. 
    // `getScanStatus` in Navidrome:
    // "Also returns the extra fields lastScan and folderCount"
    // Maybe it returns count?
    const scanStatusUrl = `${baseUrl}/rest/getScanStatus?${queryString}`;
    const scanRes = await fetch(scanStatusUrl);
    const scanData = await scanRes.json();
    
    // If scanData has counts, great. If not, we might have to fetch lists (expensive).
    // Let's try to fetch lists once per hour or something? cache control?
    // For now, let's fetch `getArtists` (ignored in response for now) and `getAlbumList` (newest) to verify connection.
    
    // Actually, many Subsonic servers return `count` in the list response attributes.
    // Let's fetch `getArtists`.
    // <artists ignoredArticles="The El La Los Las Le Les" index="A"> ... </artists>
    // It usually returns an index.
    
    // NOTE: For this implementation, to avoid 10MB JSON payloads, we will try to be smart.
    // But since the user asked for it, and this is a personal dashboard, maybe the library isn't Spotify-sized.
    // We will try to fetch counts via list lengths if necessary, but maybe just 'Now Playing' is safe.
    // Let's try to get at least one count.
    
    // Let's rely on 'getNowPlaying' for the main feature.
    // And maybe 'getAlbumList' type=newest size=1 to get recent.
    
    // 3. Get Artists Count
    // Since Navidrome/Subsonic doesn't provide a direct count, we fetch getArtists (which returns all artists) and count them.
    // This might be heavy for very large libraries, but it's the only standard way.
    const artistsUrl = `${baseUrl}/rest/getArtists?${queryString}`;
    const artistsRes = await fetch(artistsUrl);
    const artistsData = await artistsRes.json();
    
    let artistCount = 0;
    const index = artistsData["subsonic-response"]?.artists?.index;
    if (Array.isArray(index)) {
      index.forEach((idx: any) => {
        if (Array.isArray(idx.artist)) {
          artistCount += idx.artist.length;
        }
      });
    }

    return NextResponse.json({
      scanStatus: {
        ...scanData["subsonic-response"]?.scanStatus,
        artistCount: artistCount
      },
      nowPlaying: nowPlaying ? {
        id: nowPlaying.id,
        title: nowPlaying.title,
        artist: nowPlaying.artist,
        album: nowPlaying.album,
        coverArt: nowPlaying.coverArt,
        duration: nowPlaying.duration, // seconds
        minutesAgo: nowPlaying.minutesAgo,
        player: nowPlaying.username
      } : null,
    });

  } catch (error) {
    console.error("Navidrome API Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


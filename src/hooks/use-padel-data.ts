import useSWR from "swr";
import { 
  PadelMatchesResponse,
  PadelTournamentsResponse,
  PadelMatch
} from "@/types";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Padel data');
    return res.json();
};

export function usePadelData(refreshInterval: number) {
  const { data: matches, error: matchesError } = useSWR<PadelMatchesResponse>(
    "/api/padel?endpoint=matches",
    fetcher,
    { refreshInterval }
  );
  
  const { data: tournaments, error: tournamentsError } = useSWR<PadelTournamentsResponse>(
    "/api/padel?endpoint=tournaments",
    fetcher,
    { refreshInterval: refreshInterval > 0 ? refreshInterval * 6 : 0 } // Refresh tournaments less frequently
  );

  // Filter live matches from the matches data based on status field
  const liveMatches = (matches?.data || matches?.matches || []).filter(
    (match: PadelMatch) => match.status === "live" || match.status === "in_progress"
  );

  return {
    matches: matches?.data || matches?.matches || [],
    liveMatches: liveMatches,
    tournaments: tournaments?.data || tournaments?.tournaments || [],
    isLoading: !matches && !matchesError,
    isError: matchesError || tournamentsError
  };
}


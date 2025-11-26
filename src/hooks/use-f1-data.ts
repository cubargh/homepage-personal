import useSWR from "swr";
import { 
  F1ApiNextResponse, 
  F1ApiDriverChampionshipResponse, 
  F1ApiConstructorChampionshipResponse 
} from "@/types";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch F1 data');
    return res.json();
};

export function useF1Data(refreshInterval: number) {
  const { data: nextRace, error: nextRaceError } = useSWR<F1ApiNextResponse>(
    "/api/f1?path=current/next",
    fetcher,
    { refreshInterval }
  );
  
  const { data: drivers, error: driversError } = useSWR<F1ApiDriverChampionshipResponse>(
    "/api/f1?path=current/drivers-championship",
    fetcher,
    { refreshInterval }
  );
  
  const { data: constructors, error: constructorsError } = useSWR<F1ApiConstructorChampionshipResponse>(
    "/api/f1?path=current/constructors-championship",
    fetcher,
    { refreshInterval }
  );

  return {
    nextRace: nextRace?.race?.[0],
    season: nextRace?.season,
    driverStandings: drivers?.drivers_championship || [],
    constructorStandings: constructors?.constructors_championship || [],
    isLoading: !nextRace && !nextRaceError,
    isError: nextRaceError || driversError || constructorsError
  };
}


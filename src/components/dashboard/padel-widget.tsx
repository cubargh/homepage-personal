"use client";

import { useMemo } from "react";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePadelData } from "@/hooks/use-padel-data";
import { PadelMatch, PadelTournament, PadelPair } from "@/types";
import { Trophy, Calendar } from "lucide-react";

interface PadelWidgetProps {
  config: {
    enabled: boolean;
    refreshInterval: number;
    timezone: string;
  };
}

// Constants
const HIDDEN_SCORE_PLACEHOLDER = "hidden_free_plan";
const DEFAULT_TEAM_NAME = "TBD";
const DEFAULT_SCHEDULE_LABEL = "TBD";

// Format tournament level for better display
const formatTournamentLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    finals: "Finals",
    major: "Major",
    p1: "Premier Padel P1",
    p2: "Premier Padel P2",
    fip_platinum: "FIP Platinum",
    fip_gold: "FIP Gold",
    fip_silver: "FIP Silver",
    wpt_master: "WPT Master",
    wpt_1000: "WPT 1000",
    wpt_500: "WPT 500",
    wpt_final: "WPT Final",
  };
  return levelMap[level] || level.toUpperCase();
};

// Abbreviate player names
const abbreviateName = (name: string): string => {
  if (!name || name.trim() === "") return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  if (parts.length === 2) {
    // "Agustin Tapia" -> "A. Tapia"
    return `${parts[0][0]}. ${parts[1]}`;
  }
  // "Claudia Fernandez Sanchez" -> "C. F. Sanchez"
  const initials = parts
    .slice(0, -1)
    .map((part) => `${part[0]}.`)
    .join(" ");
  return `${initials} ${parts[parts.length - 1]}`;
};

// Format team name from players
const getTeamName = (team: PadelPair[] | undefined): string => {
  if (!team || team.length === 0) return DEFAULT_TEAM_NAME;
  return team.map((p) => abbreviateName(p.name)).join(" / ");
};

// Get round name
const getRoundName = (round: number): string => {
  const roundMap: Record<number, string> = {
    1: "Final",
    2: "Semifinal",
    4: "Quarterfinal",
    8: "Round of 16",
    16: "Round of 32",
    32: "Round of 64",
  };
  return roundMap[round] || `Round ${round}`;
};

// Match card component props
interface MatchCardProps {
  match: PadelMatch;
  tournament: PadelTournament | null;
  team1Name: string;
  team2Name: string;
  isLive?: boolean;
  formatMatchTime: (match: PadelMatch) => string;
  getRoundName: (round: number) => string;
}

// Match card component for live matches
function LiveMatchCard({
  match,
  tournament,
  team1Name,
  team2Name,
  getRoundName,
}: MatchCardProps) {
  return (
    <div className="flex border border-destructive/30 rounded-lg p-2 bg-destructive/10 mb-1 last:mb-0 gap-3">
      {/* Left side: Tournament info and teams */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tournament name, round and category header */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
            {tournament && (
              <span className="font-semibold text-accent">
                {tournament.name}
              </span>
            )}
            {tournament && " • "}
            {getRoundName(match.round)} •{" "}
            {match.category === "men" ? "Men's" : "Women's"}
            {match.court && ` • Court: ${match.court}`}
          </div>
        </div>

        {/* Teams - Stacked vertically */}
        <div className="flex flex-col gap-1 overflow-hidden">
          {/* Team 1 */}
          <div
            className="font-medium text-xs md:text-sm truncate"
            title={team1Name}
          >
            {team1Name}
          </div>

          {/* Team 2 */}
          <div
            className="font-medium text-xs md:text-sm truncate"
            title={team2Name}
          >
            {team2Name}
          </div>
        </div>
      </div>

      {/* Score - On the right, vertically centered */}
      <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
        <Badge
          variant="destructive"
          className="text-[9px] h-4 px-1 animate-pulse mb-1"
        >
          LIVE
        </Badge>
        <div className="flex flex-col items-center justify-center">
          {match.score && match.score !== HIDDEN_SCORE_PLACEHOLDER ? (
            <div className="text-[10px] md:text-xs font-semibold text-foreground">
              {match.score}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Match card component for upcoming matches
function UpcomingMatchCard({
  match,
  tournament,
  team1Name,
  team2Name,
  isLive,
  formatMatchTime,
  getRoundName,
}: MatchCardProps) {
  const isFinished = match.status === "finished";

  return (
    <div className="flex border border-border/30 rounded-lg p-2 hover:bg-white/5 transition-colors mb-1 last:mb-0 bg-card/40 gap-3">
      {/* Left side: Tournament info and teams */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tournament name, round and category header */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
            {tournament && (
              <span className="font-semibold text-accent">
                {tournament.name}
              </span>
            )}
            {tournament && " • "}
            {getRoundName(match.round)} •{" "}
            {match.category === "men" ? "Men's" : "Women's"}
          </div>
        </div>

        {/* Teams - Stacked vertically */}
        <div className="flex flex-col gap-1 overflow-hidden">
          {/* Team 1 */}
          <div
            className="font-medium text-xs md:text-sm truncate"
            title={team1Name}
          >
            {team1Name}
          </div>

          {/* Team 2 */}
          <div
            className="font-medium text-xs md:text-sm truncate"
            title={team2Name}
          >
            {team2Name}
          </div>
        </div>
      </div>

      {/* Score / Time - On the right, vertically centered */}
      <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
        {isLive && (
          <Badge
            variant="destructive"
            className="text-[9px] h-4 px-1 animate-pulse mb-1"
          >
            LIVE
          </Badge>
        )}
        <div className="flex flex-col items-center justify-center">
          {isLive || isFinished ? (
            <>
              {match.score && match.score !== HIDDEN_SCORE_PLACEHOLDER ? (
                <>
                  <div className="text-[10px] md:text-xs font-semibold text-foreground">
                    {match.score}
                  </div>
                  {isFinished && (
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5 md:mt-1">
                      FT
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground/50">
                  VS
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] md:text-xs font-bold text-muted-foreground/50">
                VS
              </span>
              <span className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1">
                {formatMatchTime(match)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PadelContent({ config }: PadelWidgetProps) {
  const { matches, liveMatches, tournaments, isLoading, isError } =
    usePadelData(config.enabled ? config.refreshInterval : 0);

  // Memoize tournament date ranges for performance
  const tournamentDateRanges = useMemo(() => {
    return tournaments
      .map((tournament) => {
        try {
          return {
            tournament,
            startDate: parseISO(tournament.start_date),
            endDate: parseISO(tournament.end_date),
          };
        } catch {
          return null;
        }
      })
      .filter(
        (
          range
        ): range is {
          tournament: PadelTournament;
          startDate: Date;
          endDate: Date;
        } => range !== null
      );
  }, [tournaments]);

  // Optimized tournament lookup function
  const getTournamentForMatch = (match: PadelMatch): PadelTournament | null => {
    if (!match.played_at) return null;

    try {
      const matchDate = parseISO(match.played_at);

      // Find tournament where match date falls within tournament date range
      const matchingRange = tournamentDateRanges.find(
        ({ startDate, endDate }) =>
          matchDate >= startDate && matchDate <= endDate
      );

      return matchingRange?.tournament || null;
    } catch {
      return null;
    }
  };

  const upcomingMatches = useMemo(() => {
    const today = new Date();
    const todayStr = formatTime(today, "yyyy-MM-dd", config.timezone);

    return matches
      .filter((match: PadelMatch) => {
        if (!match.played_at) return true; // Include scheduled matches
        const matchDateStr = formatTime(
          parseISO(match.played_at),
          "yyyy-MM-dd",
          config.timezone
        );
        return matchDateStr >= todayStr;
      })
      .sort((a: PadelMatch, b: PadelMatch) => {
        const dateA = a.played_at ? parseISO(a.played_at).getTime() : Infinity;
        const dateB = b.played_at ? parseISO(b.played_at).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 10);
  }, [matches, config.timezone]);

  const formatMatchTime = (match: PadelMatch) => {
    if (!match.played_at) {
      return match.schedule_label || DEFAULT_SCHEDULE_LABEL;
    }
    try {
      const date = parseISO(match.played_at);
      return formatTime(date, "MMM dd, HH:mm", config.timezone);
    } catch {
      return match.schedule_label || DEFAULT_SCHEDULE_LABEL;
    }
  };

  // Helper to get date string safely
  const getDateString = (date: Date | null): string | null => {
    if (!date) return null;
    try {
      return formatTime(date, "yyyy-MM-dd", config.timezone);
    } catch {
      return null;
    }
  };

  // Helper to parse date safely
  const parseDateSafely = (
    dateString: string | null | undefined
  ): Date | null => {
    if (!dateString) return null;
    try {
      return parseISO(dateString);
    } catch {
      return null;
    }
  };

  if (isError) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Failed to load padel data
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading padel data...
      </div>
    );
  }

  return (
    <Tabs defaultValue="matches" className="h-full flex flex-col">
      <div className="px-6">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
          <TabsTrigger value="matches">
            <div className="flex items-center gap-2">
              <Trophy className="h-3 w-3" />
              Matches
              {liveMatches.length > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1">
                  {liveMatches.length} LIVE
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="tournaments">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Tournaments
            </div>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="matches" className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {liveMatches.length > 0 && (
              <div className="space-y-1 mb-2">
                <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Badge
                    variant="destructive"
                    className="text-[9px] h-4 px-1 animate-pulse"
                  >
                    LIVE
                  </Badge>
                  Live Matches
                </div>
                {liveMatches.map((match: PadelMatch, index) => {
                  const team1Name = getTeamName(match.players?.team_1);
                  const team2Name = getTeamName(match.players?.team_2);
                  const tournament = getTournamentForMatch(match);

                  // Date header logic with safe parsing
                  const matchDate = parseDateSafely(match.played_at);
                  const prevMatch = index > 0 ? liveMatches[index - 1] : null;
                  const prevMatchDate = parseDateSafely(prevMatch?.played_at);

                  const matchDateStr = getDateString(matchDate);
                  const prevMatchDateStr = getDateString(prevMatchDate);

                  const showDateHeader =
                    matchDateStr !== null &&
                    prevMatchDateStr !== null &&
                    matchDateStr !== prevMatchDateStr;

                  return (
                    <div key={match.id}>
                      {showDateHeader && matchDate && (
                        <div className="py-1 mt-1 text-center">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {formatTime(
                              matchDate,
                              "EEEE, MMM d",
                              config.timezone
                            )}
                          </span>
                        </div>
                      )}
                      <LiveMatchCard
                        match={match}
                        tournament={tournament}
                        team1Name={team1Name}
                        team2Name={team2Name}
                        formatMatchTime={formatMatchTime}
                        getRoundName={getRoundName}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {upcomingMatches.length === 0 && liveMatches.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                <div>No upcoming matches scheduled</div>
                <div className="text-xs mt-1">
                  Matches will appear here when tournaments are scheduled
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {liveMatches.length > 0 && (
                  <div className="text-xs font-semibold text-foreground mb-1">
                    Upcoming Matches
                  </div>
                )}
                {upcomingMatches.map((match: PadelMatch, index) => {
                  const isLive =
                    match.status === "live" || match.status === "in_progress";
                  const team1Name = getTeamName(match.players?.team_1);
                  const team2Name = getTeamName(match.players?.team_2);
                  const tournament = getTournamentForMatch(match);

                  // Date header logic with safe parsing
                  const matchDate = parseDateSafely(match.played_at);
                  const prevMatch =
                    index > 0 ? upcomingMatches[index - 1] : null;
                  const prevMatchDate = parseDateSafely(prevMatch?.played_at);

                  const matchDateStr = getDateString(matchDate);
                  const prevMatchDateStr = getDateString(prevMatchDate);

                  const showDateHeader =
                    matchDateStr !== null &&
                    prevMatchDateStr !== null &&
                    matchDateStr !== prevMatchDateStr;

                  return (
                    <div key={match.id}>
                      {showDateHeader && matchDate && (
                        <div className="py-1 mt-1 text-center">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {formatTime(
                              matchDate,
                              "EEEE, MMM d",
                              config.timezone
                            )}
                          </span>
                        </div>
                      )}
                      <UpcomingMatchCard
                        match={match}
                        tournament={tournament}
                        team1Name={team1Name}
                        team2Name={team2Name}
                        isLive={isLive}
                        formatMatchTime={formatMatchTime}
                        getRoundName={getRoundName}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="tournaments" className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {tournaments.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                No upcoming tournaments
              </div>
            ) : (
              <div className="space-y-1">
                {tournaments.map((tournament: PadelTournament) => (
                  <div
                    key={tournament.id}
                    className={`text-xs p-2 rounded border border-border/50 hover:border-accent transition-colors mb-1 ${
                      tournament.url ? "cursor-pointer" : ""
                    }`}
                    onClick={() =>
                      tournament.url && window.open(tournament.url, "_blank")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {tournament.name}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {formatTournamentLevel(tournament.level)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1 flex-shrink-0"
                      >
                        {tournament.status}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatTime(
                          parseISO(tournament.start_date),
                          "MMM dd",
                          config.timezone
                        )}{" "}
                        -{" "}
                        {formatTime(
                          parseISO(tournament.end_date),
                          "MMM dd",
                          config.timezone
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          {tournament.location}, {tournament.country}
                        </span>
                        {tournament.url && (
                          <span className="text-[9px] opacity-70">
                            • Click for details
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

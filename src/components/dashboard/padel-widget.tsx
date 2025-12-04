"use client";

import { useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePadelData } from "@/hooks/use-padel-data";
import { PadelMatch, PadelTournament } from "@/types";
import { Trophy, Calendar, Clock } from "lucide-react";

interface PadelWidgetProps {
  config: {
    enabled: boolean;
    refreshInterval: number;
    timezone: string;
  };
}

// Format tournament level for better display
const formatTournamentLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    "finals": "Finals",
    "major": "Major",
    "p1": "Premier Padel P1",
    "p2": "Premier Padel P2",
    "fip_platinum": "FIP Platinum",
    "fip_gold": "FIP Gold",
    "fip_silver": "FIP Silver",
    "wpt_master": "WPT Master",
    "wpt_1000": "WPT 1000",
    "wpt_500": "WPT 500",
    "wpt_final": "WPT Final",
  };
  return levelMap[level] || level.toUpperCase();
};

export function PadelContent({ config }: PadelWidgetProps) {
  const [view, setView] = useState<"matches" | "tournaments">("matches");
  const { matches, liveMatches, tournaments, isLoading, isError } = usePadelData(
    config.enabled ? config.refreshInterval : 0
  );

  const upcomingMatches = useMemo(() => {
    const today = new Date();
    const todayStr = formatTime(today, "yyyy-MM-dd", config.timezone);
    
    return matches
      .filter((match: PadelMatch) => {
        if (!match.played_at) return true; // Include scheduled matches
        const matchDateStr = formatTime(parseISO(match.played_at), "yyyy-MM-dd", config.timezone);
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
      return match.schedule_label || "TBD";
    }
    try {
      const date = parseISO(match.played_at);
      return formatTime(date, "MMM dd, HH:mm", config.timezone);
    } catch {
      return match.schedule_label || "TBD";
    }
  };

  const getRoundName = (round: number) => {
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
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border/50">
        <Select value={view} onValueChange={(v) => setView(v as "matches" | "tournaments")}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="matches">
              <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3" />
                Matches
                {liveMatches.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1">
                    {liveMatches.length} LIVE
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="tournaments">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Tournaments
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {view === "matches" && (
            <>
              {liveMatches.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Badge variant="destructive" className="text-[9px] h-4 px-1 animate-pulse">
                      LIVE
                    </Badge>
                    Live Matches
                  </div>
                  {liveMatches.map((match: PadelMatch) => (
                    <div
                      key={match.id}
                      className="text-xs p-2 rounded bg-destructive/10 border border-destructive/20"
                    >
                      <div className="font-semibold text-foreground mb-1">
                        {match.name}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {match.players?.team_1[0]?.name || "TBD"} vs {match.players?.team_2[0]?.name || "TBD"}
                        {match.court && ` • Court: ${match.court}`}
                      </div>
                      {match.score && match.score !== "hidden_free_plan" && (
                        <div className="text-[10px] font-semibold text-foreground mt-1">
                          Score: {match.score}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {upcomingMatches.length === 0 && liveMatches.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <div>No upcoming matches scheduled</div>
                  <div className="text-xs mt-2">Matches will appear here when tournaments are scheduled</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveMatches.length > 0 && (
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Upcoming Matches
                    </div>
                  )}
                  {upcomingMatches.map((match: PadelMatch) => {
                    const isLive = match.status === "live" || match.status === "in_progress";
                    const isFinished = match.status === "finished";
                    
                    return (
                      <div
                        key={match.id}
                        className="text-xs p-2 rounded border border-border/50 hover:border-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {match.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {getRoundName(match.round)} • {match.category === "men" ? "Men's" : "Women's"}
                            </div>
                          </div>
                          {isLive && (
                            <Badge variant="destructive" className="text-[9px] h-4 px-1 animate-pulse">
                              LIVE
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatMatchTime(match)}
                          </div>
                          {isFinished && match.score !== "hidden_free_plan" && (
                            <div className="text-[10px] font-semibold text-foreground">
                              {match.score}
                            </div>
                          )}
                        </div>

                        {match.players && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <div className="text-[10px] text-muted-foreground">
                              <div className="truncate">
                                {match.players.team_1[0]?.name || "TBD"}
                              </div>
                              <div className="truncate mt-0.5">
                                vs {match.players.team_2[0]?.name || "TBD"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === "tournaments" && (
            <>
              {tournaments.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No upcoming tournaments
                </div>
              ) : (
                <div className="space-y-2">
                  {tournaments.map((tournament: PadelTournament) => (
                    <div
                      key={tournament.id}
                      className={`text-xs p-2 rounded border border-border/50 hover:border-accent transition-colors ${tournament.url ? 'cursor-pointer' : ''}`}
                      onClick={() => tournament.url && window.open(tournament.url, '_blank')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {tournament.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            {formatTournamentLevel(tournament.level)}
                          </div>
                        </div>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
                            {tournament.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatTime(parseISO(tournament.start_date), "MMM dd", config.timezone)} - {formatTime(parseISO(tournament.end_date), "MMM dd", config.timezone)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{tournament.location}, {tournament.country}</span>
                            {tournament.url && (
                              <span className="text-[9px] opacity-70">• Click for details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


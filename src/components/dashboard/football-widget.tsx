"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FootballResponse } from "@/types";
import { Trophy } from "lucide-react";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch football data');
    }
    return res.json();
};

const COMPETITIONS = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "CL", name: "Champions League" },
  { code: "EL", name: "Europa League" },
];

interface FootballWidgetProps {
  config: {
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
}

export function FootballWidget({ config }: FootballWidgetProps) {
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const { data, error, isLoading } = useSWR<FootballResponse>(
    "/api/football?endpoint=matches",
    fetcher,
    {
       refreshInterval: config.refreshInterval, 
    }
  );

  const matches = data?.matches || [];
  
  // Filter and sort matches
  const filteredMatches = useMemo(() => {
      const filtered = matches.filter(
          (match) => match.competition.code === selectedLeague
      );

      return filtered.sort((a, b) => {
          // 1. Sort by Date (Time)
          const dateDiff = new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
          if (dateDiff !== 0) return dateDiff;

          // 2. Sort by Home Team Name (Deterministic Tie-breaker)
          return a.homeTeam.name.localeCompare(b.homeTeam.name);
      });
  }, [matches, selectedLeague]);

  const renderScoreOrTime = (match: any) => {
      const isLive = ["IN_PLAY", "PAUSED"].includes(match.status);
      const isFinished = match.status === "FINISHED";
      
      if (isLive || isFinished) {
          return (
              <div className="flex flex-col items-center min-w-[50px]">
                  <div className="flex items-center gap-1 md:gap-2 font-bold text-foreground text-xs md:text-sm">
                      <span>{match.score.fullTime.home ?? 0}</span>
                      <span>-</span>
                      <span>{match.score.fullTime.away ?? 0}</span>
                  </div>
                  {isLive && (
                      <Badge variant="destructive" className="text-[9px] md:text-[10px] h-3 md:h-4 px-1 md:px-1.5 animate-pulse mt-0.5 md:mt-1">
                          LIVE
                      </Badge>
                  )}
                  {isFinished && (
                      <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5 md:mt-1">FT</span>
                  )}
              </div>
          );
      }
      
      return (
          <div className="flex flex-col items-center min-w-[50px]">
             <span className="text-[10px] md:text-xs font-bold text-muted-foreground/50">VS</span>
             <span className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 md:mt-1">
                 {formatTime(parseISO(match.utcDate), "HH:mm", config.timezone)}
             </span>
          </div>
      );
  };

  return (
    <Card className="h-full flex flex-col border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 pt-4">
        <CardTitle className="flex items-center space-x-2 text-primary">
            <Trophy className="h-5 w-5" />
            <span>Matches</span>
        </CardTitle>
        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-[120px] md:w-[140px] h-8 text-xs">
                <SelectValue placeholder="Select League" />
            </SelectTrigger>
            <SelectContent>
                {COMPETITIONS.map((comp) => (
                    <SelectItem key={comp.code} value={comp.code} className="text-xs">
                        {comp.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
            {isLoading ? (
                 <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-secondary/20 rounded animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <p className="text-destructive/80 text-sm">Failed to load matches.</p>
            ) : (
                <div className="space-y-2">
                    {filteredMatches.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 text-sm">
                            No matches found for {COMPETITIONS.find(c => c.code === selectedLeague)?.name} in the next 6 days.
                        </p>
                    ) : (
                        filteredMatches.map((match, index) => {
                            const matchDate = parseISO(match.utcDate);
                            const prevMatchDate = index > 0 ? parseISO(filteredMatches[index - 1].utcDate) : null;
                            
                            // Compare dates in the configured timezone
                            const matchDateStr = formatTime(matchDate, "yyyy-MM-dd", config.timezone);
                            const prevMatchDateStr = prevMatchDate ? formatTime(prevMatchDate, "yyyy-MM-dd", config.timezone) : null;
                            
                            const showDateHeader = matchDateStr !== prevMatchDateStr;

                            return (
                                <div key={match.id}>
                                    {showDateHeader && (
                                        <div className="flex items-center py-2 mt-1">
                                            <div className="flex-grow border-t border-border/30"></div>
                                            <span className="mx-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                {formatTime(matchDate, "EEEE, MMM d", config.timezone)}
                                            </span>
                                            <div className="flex-grow border-t border-border/30"></div>
                                        </div>
                                    )}
                                    <div className="flex flex-col border border-border/30 rounded-lg p-2 md:p-3 hover:bg-white/5 transition-colors mb-2 last:mb-0 bg-card/40">
                                        {/* Competition Name removed as it's redundant with the filter */}
                                        
                                        <div className="flex items-center justify-between">
                                            {/* Home Team */}
                                            <div className="flex items-center space-x-2 w-[38%] overflow-hidden">
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="h-5 w-5 md:h-6 md:w-6 object-contain shrink-0" />
                                                <span className="font-medium text-xs md:text-sm truncate" title={match.homeTeam.name}>
                                                    {/* Prefer shortName on mobile if available, otherwise name */}
                                                    <span className="md:hidden">{match.homeTeam.shortName || match.homeTeam.tla || match.homeTeam.name}</span>
                                                    <span className="hidden md:inline">{match.homeTeam.name}</span>
                                                </span>
                                            </div>
                                            
                                            {/* Score / Time */}
                                            <div className="w-[24%] flex justify-center shrink-0">
                                                {renderScoreOrTime(match)}
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex items-center space-x-2 justify-end w-[38%] overflow-hidden">
                                                <span className="font-medium text-xs md:text-sm truncate text-right" title={match.awayTeam.name}>
                                                    <span className="md:hidden">{match.awayTeam.shortName || match.awayTeam.tla || match.awayTeam.name}</span>
                                                    <span className="hidden md:inline">{match.awayTeam.name}</span>
                                                </span>
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="h-5 w-5 md:h-6 md:w-6 object-contain shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

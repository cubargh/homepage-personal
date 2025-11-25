"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, parseISO, isSameDay } from "date-fns";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COMPETITIONS = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "CL", name: "Champions League" },
  { code: "EL", name: "Europa League" },
];

export function FootballWidget() {
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const { data, error, isLoading } = useSWR<FootballResponse>(
    "/api/football?endpoint=matches",
    fetcher,
    {
       refreshInterval: 60000 * 1, // 1 minute for live scores
    }
  );

  const matches = data?.matches || [];
  
  // Filter matches based on selection
  const filteredMatches = matches.filter(
      (match) => match.competition.code === selectedLeague
  );

  const renderScoreOrTime = (match: any) => {
      const isLive = ["IN_PLAY", "PAUSED"].includes(match.status);
      const isFinished = match.status === "FINISHED";
      
      if (isLive || isFinished) {
          return (
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                      <span>{match.score.fullTime.home ?? 0}</span>
                      <span>-</span>
                      <span>{match.score.fullTime.away ?? 0}</span>
                  </div>
                  {isLive && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5 animate-pulse mt-1">
                          LIVE
                      </Badge>
                  )}
                  {isFinished && (
                      <span className="text-[10px] text-muted-foreground font-medium mt-1">FT</span>
                  )}
              </div>
          );
      }
      
      return (
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-muted-foreground/50">VS</span>
             <span className="text-[10px] text-muted-foreground mt-1">{format(parseISO(match.utcDate), "HH:mm")}</span>
          </div>
      );
  };

  return (
    <Card className="h-full flex flex-col border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2 text-primary">
            <Trophy className="h-5 w-5" />
            <span>Matches</span>
        </CardTitle>
        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
        <ScrollArea className="h-full px-6 pb-6">
            {isLoading ? (
                 <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-secondary/20 rounded animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <p className="text-destructive/80 text-sm">Failed to load matches.</p>
            ) : (
                <div className="space-y-3">
                    {filteredMatches.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 text-sm">
                            No matches found for {COMPETITIONS.find(c => c.code === selectedLeague)?.name} in the next 6 days.
                        </p>
                    ) : (
                        filteredMatches.map((match, index) => {
                            const matchDate = parseISO(match.utcDate);
                            const prevMatchDate = index > 0 ? parseISO(filteredMatches[index - 1].utcDate) : null;
                            const showDateHeader = !prevMatchDate || !isSameDay(matchDate, prevMatchDate);

                            return (
                                <div key={match.id}>
                                    {showDateHeader && (
                                        <div className="flex items-center py-2">
                                            <div className="flex-grow border-t border-border/30"></div>
                                            <span className="mx-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                {format(matchDate, "EEEE, MMM d")}
                                            </span>
                                            <div className="flex-grow border-t border-border/30"></div>
                                        </div>
                                    )}
                                    <div className="flex flex-col space-y-2 border border-border/30 rounded-lg p-3 hover:bg-white/5 transition-colors mb-3 last:mb-0">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                                            <span className="text-primary/80 font-semibold truncate max-w-[60%]">{match.competition.name}</span>
                                            {/* Date is now shown in header, keeping time mostly relevant context or if header is far away, but header is per day so it's fine. Keeping formatted date/time or just time could work. Let's keep simple date for context if header scrolled out, or just remove it? The user asked for division, usually implies removing redundant date info. But let's keep day for now or maybe just time if desired. Let's stick to previous format but maybe simpler. */}
                                            <span>{format(matchDate, "HH:mm")}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center space-x-3 w-[40%]">
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="h-6 w-6 object-contain" />
                                                <span className="font-medium text-sm truncate" title={match.homeTeam.name}>{match.homeTeam.name}</span>
                                            </div>
                                            
                                            <div className="w-[20%] flex justify-center">
                                                {renderScoreOrTime(match)}
                                            </div>

                                            <div className="flex items-center space-x-3 justify-end w-[40%]">
                                                <span className="font-medium text-sm truncate text-right" title={match.awayTeam.name}>{match.awayTeam.name}</span>
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="h-6 w-6 object-contain" />
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

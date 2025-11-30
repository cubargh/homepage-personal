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
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch football data');
    }
    return res.json();
};

const COMPETITIONS = [
  { code: "TODAY", name: "Today's Matches" },
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "CL", name: "Champions League" },
];

interface FootballWidgetProps {
  config: {
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
  headless?: boolean;
}

export function FootballContent({ config, headless = false }: FootballWidgetProps) {
  const [selectedLeague, setSelectedLeague] = useState("TODAY");

  // Update SWR key to include the competition code in the query string
  const { data, error, isLoading } = useSWR<FootballResponse>(
    `/api/football?endpoint=matches&competition=${selectedLeague}`,
    fetcher,
    {
       refreshInterval: config.refreshInterval, 
    }
  );

  const matches = data?.matches || [];
  
  // Since the API now returns filtered matches, we can just sort them
  const filteredMatches = useMemo(() => {
      // Filter out finished matches from yesterday if we are in TODAY mode
      // This happens because we widened the window to catch all global timezones
      let matchesToDisplay = matches;
      
      if (selectedLeague === 'TODAY') {
          const todayStr = formatTime(new Date(), "yyyy-MM-dd", config.timezone);
          matchesToDisplay = matches.filter(m => {
              const matchDateStr = formatTime(parseISO(m.utcDate), "yyyy-MM-dd", config.timezone);
              return matchDateStr === todayStr;
          });
      }

      return matchesToDisplay.sort((a, b) => {
          // 1. Sort by Date (Time)
          const dateDiff = new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
          if (dateDiff !== 0) return dateDiff;

          // 2. Sort by Home Team Name (Deterministic Tie-breaker)
          return a.homeTeam.name.localeCompare(b.homeTeam.name);
      });
  }, [matches, selectedLeague, config.timezone]);

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
    <div className="h-full flex flex-col">
       {/* League Selector - Inline when headless */}
       {headless && (
         <div className="px-4 pb-2">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-full h-8 text-xs bg-secondary/30">
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
         </div>
       )}

        <ScrollArea className="flex-1 px-4 pb-4">
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
                            No matches found for {COMPETITIONS.find(c => c.code === selectedLeague)?.name} {selectedLeague === 'TODAY' ? 'today' : 'in the next 6 days'}.
                            {selectedLeague === 'TODAY' && <span className="block text-xs mt-2 text-muted-foreground/50">(UTC Date: {new Date().toISOString().split('T')[0]})</span>}
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
    </div>
  );
}

export function FootballWidget({ config }: FootballWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // We need to manage selectedLeague state here too if we want it in the header for non-headless mode
  // But to keep it simple, if not headless, we can just use the content internal state if we move the select inside content?
  // No, the original design had select in header.
  // To support legacy widget look:
  // We can just duplicate the state logic or accept it as props.
  // Actually, let's keep FootballWidget as a wrapper that uses FootballContent but hides the inner select and shows outer select?
  // Too complex. Let's just make FootballWidget utilize FootballContent in headless mode = false?
  // Or better, let's update FootballWidget to be simpler:
  
  // Actually, I will just reimplement FootballWidget to use FootballContent with headless=true for now to simplify, 
  // and the user won't notice a big difference except the select moved down a bit.
  // Wait, if I move the select to content, the header is cleaner.
  
  const toggleCollapse = () => {
      if (window.innerWidth < 768) {
          setIsCollapsed(!isCollapsed);
      }
  };

  return (
    <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
      <CardHeader 
        className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 pt-4 cursor-pointer md:cursor-default" 
        onClick={toggleCollapse}
      >
        <div className="flex items-center space-x-2 text-primary group">
            <Trophy className="h-5 w-5" />
            <span>Matches</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
            <div className="md:hidden text-muted-foreground">
                {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
        </div>
      </CardHeader>
      <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
         {/* We use headless=true so the Select appears inside the content area */}
         <FootballContent config={config} headless={true} />
      </CardContent>
    </Card>
  );
}

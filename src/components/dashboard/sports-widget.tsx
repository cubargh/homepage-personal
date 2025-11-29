"use client";

import { useState, useEffect, useRef } from "react";
import { addDays } from "date-fns";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { F1Content } from "./f1-widget";
import { FootballContent } from "./football-widget";
import { Flag, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useF1Data } from "@/hooks/use-f1-data";

interface SportsWidgetProps {
  f1Config: {
    enabled: boolean;
    refreshInterval: number;
    timezone: string;
  };
  footballConfig: {
    enabled: boolean;
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
}

export function SportsWidget({ f1Config, footballConfig }: SportsWidgetProps) {
  // Default active tab based on enabled status
  const defaultTab = footballConfig.enabled ? "football" : (f1Config.enabled ? "f1" : "football");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasSetDefaultTab = useRef(false);

  const { nextRace } = useF1Data(f1Config.refreshInterval);

  useEffect(() => {
    // Only auto-switch to F1 if F1 is enabled
    if (f1Config.enabled && nextRace && !hasSetDefaultTab.current) {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const todayStr = formatTime(today, "yyyy-MM-dd", f1Config.timezone);
      const tomorrowStr = formatTime(tomorrow, "yyyy-MM-dd", f1Config.timezone);
      
      const relevantDates = [todayStr, tomorrowStr];
      
      // Check if any session is today or tomorrow
      const schedule = nextRace.schedule;
      const sessions = [
        schedule.fp1,
        schedule.fp2,
        schedule.fp3,
        schedule.qualy,
        schedule.sprintQualy,
        schedule.sprintRace,
        schedule.race
      ].filter(Boolean);

      const hasF1Event = sessions.some(session => 
        session && relevantDates.includes(session.date)
      );

      if (hasF1Event) {
        setActiveTab("f1");
      }
      
      hasSetDefaultTab.current = true;
    }
  }, [nextRace, f1Config.timezone, f1Config.enabled]);

  const toggleCollapse = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // If only one is enabled, don't show tabs, just content
  if (f1Config.enabled && !footballConfig.enabled) {
      return (
        <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
            <CardHeader className="p-0 border-b border-border/50">
               <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs font-semibold flex gap-2 items-center text-foreground">
                      <Flag className="h-3 w-3" /> F1
                  </div>
                  <div className="md:hidden ml-2 text-muted-foreground cursor-pointer" onClick={toggleCollapse}>
                     {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </div>
               </div>
            </CardHeader>
            <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
                <F1Content config={f1Config} />
            </CardContent>
        </Card>
      );
  }

  if (!f1Config.enabled && footballConfig.enabled) {
      return (
        <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
            <CardHeader className="p-0 border-b border-border/50">
               <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs font-semibold flex gap-2 items-center text-foreground">
                      <Trophy className="h-3 w-3" /> Matches
                  </div>
                  <div className="md:hidden ml-2 text-muted-foreground cursor-pointer" onClick={toggleCollapse}>
                     {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </div>
               </div>
            </CardHeader>
            <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
                <FootballContent config={footballConfig} headless={true} />
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
        <CardHeader className="p-0 border-b border-border/50">
           <div className="flex items-center justify-between px-4 py-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 bg-secondary/30 h-9">
                    <TabsTrigger value="f1" className="text-xs font-semibold flex gap-2 items-center justify-center">
                        <Flag className="h-3 w-3" /> F1
                    </TabsTrigger>
                    <TabsTrigger value="football" className="text-xs font-semibold flex gap-2 items-center justify-center">
                        <Trophy className="h-3 w-3" /> Matches
                    </TabsTrigger>
                 </TabsList>
              </Tabs>
              <div className="md:hidden ml-2 text-muted-foreground cursor-pointer" onClick={toggleCollapse}>
                 {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
           </div>
        </CardHeader>
        <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
            {activeTab === 'f1' ? (
                <F1Content config={f1Config} />
            ) : (
                <FootballContent config={footballConfig} headless={true} />
            )}
        </CardContent>
    </Card>
  );
}

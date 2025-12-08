"use client";

import { useState, useEffect, useRef } from "react";
import { addDays } from "date-fns";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { F1Content } from "./f1-widget";
import { FootballContent } from "./football-widget";
import { PadelContent } from "./padel-widget";
import { Flag, Trophy, ChevronDown, ChevronUp, Activity } from "lucide-react";
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
    api_key?: string;
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
  padelConfig?: {
    enabled: boolean;
    refreshInterval: number;
    timezone: string;
  };
}

export function SportsWidget({ f1Config, footballConfig, padelConfig }: SportsWidgetProps) {
  // Provide default padelConfig if not provided
  const padelConfigWithDefaults = padelConfig || {
    enabled: false,
    refreshInterval: 60000 * 5,
    timezone: f1Config.timezone,
  };
  // Default active tab based on enabled status
  // Prefer football if enabled, then padel, then f1
  const defaultTab = footballConfig.enabled ? "football" : (padelConfigWithDefaults.enabled ? "padel" : (f1Config.enabled ? "f1" : "football"));
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasSetDefaultTab = useRef(false);

  // Only fetch F1 data if F1 is enabled (pass 0 to disable auto-refresh)
  const { nextRace } = useF1Data(f1Config.enabled ? f1Config.refreshInterval : 0);

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

  // Safety check: if none are enabled, don't render (shouldn't happen due to isEnabled check)
  if (!f1Config.enabled && !footballConfig.enabled && !padelConfigWithDefaults.enabled) {
    return null;
  }

  const toggleCollapse = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Count enabled tabs
  const enabledTabs = [
    f1Config.enabled && "f1",
    footballConfig.enabled && "football",
    padelConfigWithDefaults.enabled && "padel"
  ].filter(Boolean);

  // If only one is enabled, don't show tabs, just content
  if (enabledTabs.length === 1) {
    const singleTab = enabledTabs[0];
    let title = "";
    let icon = <Flag className="h-3 w-3" />;
    let content = null;

    if (singleTab === "f1") {
      title = "F1";
      icon = <Flag className="h-3 w-3" />;
      content = <F1Content config={f1Config} />;
    } else if (singleTab === "football") {
      title = "Matches";
      icon = <Trophy className="h-3 w-3" />;
      content = <FootballContent config={footballConfig} headless={true} />;
    } else if (singleTab === "padel") {
      title = "Padel";
      icon = <Activity className="h-3 w-3" />;
      content = <PadelContent config={padelConfigWithDefaults} />;
    }

    return (
      <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
          <CardHeader className="p-0 border-b border-border/50">
             <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs font-semibold flex gap-2 items-center text-foreground">
                    {icon} {title}
                </div>
                <div className="md:hidden ml-2 text-muted-foreground cursor-pointer" onClick={toggleCollapse}>
                   {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
             </div>
          </CardHeader>
          <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
              {content}
          </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
        <CardHeader className="p-0 border-b border-border/50">
           <div className="flex items-center justify-between px-4 py-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className={`grid w-full bg-secondary/30 h-9 ${
                   enabledTabs.length === 2 ? 'grid-cols-2' : enabledTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-1'
                 }`}>
                    {f1Config.enabled && (
                      <TabsTrigger value="f1" className="text-xs font-semibold flex gap-2 items-center justify-center">
                          <Flag className="h-3 w-3" /> F1
                      </TabsTrigger>
                    )}
                    {footballConfig.enabled && (
                      <TabsTrigger value="football" className="text-xs font-semibold flex gap-2 items-center justify-center">
                          <Trophy className="h-3 w-3" /> Matches
                      </TabsTrigger>
                    )}
                    {padelConfigWithDefaults.enabled && (
                      <TabsTrigger value="padel" className="text-xs font-semibold flex gap-2 items-center justify-center">
                          <Activity className="h-3 w-3" /> Padel
                      </TabsTrigger>
                    )}
                 </TabsList>
              </Tabs>
              <div className="md:hidden ml-2 text-muted-foreground cursor-pointer" onClick={toggleCollapse}>
                 {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
           </div>
        </CardHeader>
        <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
            {activeTab === 'f1' && f1Config.enabled && (
                <F1Content config={f1Config} />
            )}
            {activeTab === 'football' && footballConfig.enabled && (
                <FootballContent config={footballConfig} headless={true} />
            )}
            {activeTab === 'padel' && padelConfigWithDefaults.enabled && (
                <PadelContent config={padelConfigWithDefaults} />
            )}
        </CardContent>
    </Card>
  );
}

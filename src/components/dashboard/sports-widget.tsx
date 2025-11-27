"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { F1Content } from "./f1-widget";
import { FootballContent } from "./football-widget";
import { Flag, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SportsWidgetProps {
  f1Config: {
    refreshInterval: number;
    timezone: string;
  };
  footballConfig: {
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
}

export function SportsWidget({ f1Config, footballConfig }: SportsWidgetProps) {
  const [activeTab, setActiveTab] = useState("f1");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
        <CardHeader className="p-0 border-b border-border/50">
           <div className="flex items-center justify-between px-4 py-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 bg-secondary/30 h-9">
                    <TabsTrigger value="f1" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex gap-2 items-center justify-center">
                        <Flag className="h-3 w-3" /> F1
                    </TabsTrigger>
                    <TabsTrigger value="football" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex gap-2 items-center justify-center">
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


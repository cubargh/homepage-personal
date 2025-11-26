"use client";

import { useState } from "react";
import useSWR from "swr";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flag, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { TrackMap } from "@/components/dashboard/track-map";
import { 
  F1ApiNextResponse, 
  F1ApiDriverChampionshipResponse, 
  F1ApiConstructorChampionshipResponse 
} from "@/types";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch F1 data');
    }
    return res.json();
};

interface F1WidgetProps {
  config: {
    refreshInterval: number;
    timezone: string;
  };
}

export function F1Widget({ config }: F1WidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
      if (window.innerWidth < 768) {
          setIsCollapsed(!isCollapsed);
      }
  };

  const { data: nextRaceResponse } = useSWR<F1ApiNextResponse>(
    "/api/f1?path=current/next",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );
  
  const { data: driverData } = useSWR<F1ApiDriverChampionshipResponse>(
    "/api/f1?path=current/drivers-championship",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );
  
  const { data: constructorData } = useSWR<F1ApiConstructorChampionshipResponse>(
    "/api/f1?path=current/constructors-championship",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  const nextRace = nextRaceResponse?.race?.[0];
  const driverStandings = driverData?.drivers_championship || [];
  const constructorStandings = constructorData?.constructors_championship || [];

  const getScheduleItem = (name: string, dateTime?: { date: string; time: string }) => {
    // Only create item if BOTH date and time exist and are valid strings
    if (!dateTime || !dateTime.date || !dateTime.time) return null;
    
    try {
        // Ensure we treat the time as UTC by appending Z if missing, assuming API returns UTC
        const timeString = dateTime.time.endsWith('Z') ? dateTime.time : `${dateTime.time}Z`;
        const date = parseISO(`${dateTime.date}T${timeString}`);
        
        // Check if date is valid
        if (isNaN(date.getTime())) return null;
        
        return {
            name,
            date,
        };
    } catch (e) {
        console.error(`Invalid date for session ${name}:`, dateTime);
        return null;
    }
  };

  const scheduleItems = nextRace ? [
    getScheduleItem("Practice 1", nextRace.schedule.fp1),
    getScheduleItem("Practice 2", nextRace.schedule.fp2),
    getScheduleItem("Practice 3", nextRace.schedule.fp3),
    getScheduleItem("Sprint Qualy", nextRace.schedule.sprintQualy),
    getScheduleItem("Sprint", nextRace.schedule.sprintRace),
    getScheduleItem("Qualifying", nextRace.schedule.qualy),
    getScheduleItem("Race", nextRace.schedule.race),
  ].filter((item): item is { name: string; date: Date } => Boolean(item))
   .sort((a, b) => a.date.getTime() - b.date.getTime())
  : [];

  return (
    <Card className={`flex flex-col border-border/50 transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
      <CardHeader
         className="cursor-pointer md:cursor-default group"
         onClick={toggleCollapse}
      >
        <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center space-x-2">
                <Flag className="h-5 w-5" />
                <span>Formula 1</span>
            </div>
            <div className="md:hidden text-muted-foreground">
                {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
        <Tabs defaultValue="next" className="h-full flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/30">
              <TabsTrigger value="next" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Next Race</TabsTrigger>
              <TabsTrigger value="drivers" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Drivers</TabsTrigger>
              <TabsTrigger value="constructors" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Teams</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="next" className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {nextRace ? (
                    <div className="space-y-4 md:space-y-6">
                        <div className="space-y-1 text-center">
                            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest">{nextRaceResponse?.season} Season • Round {nextRace.round}</p>
                            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{nextRace.raceName}</h3>
                            <p className="text-xs text-muted-foreground">
                                {nextRace.circuit.circuitName}
                            </p>
                        </div>

                        <TrackMap 
                            circuitName={nextRace.circuit.circuitName} 
                            city={nextRace.circuit.city} 
                            country={nextRace.circuit.country}
                        />
                        
                        <div className="grid gap-2">
                            {scheduleItems.map((session) => (
                                <div key={session.name} className={`flex items-center justify-between p-2 md:p-3 rounded-lg border ${session.name === 'Race' ? 'bg-primary/10 border-primary/20' : 'bg-secondary/10 border-white/5'}`}>
                                    <div className="flex items-center space-x-3">
                                        {session.name === 'Race' ? <Flag className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                                        <span className={`text-sm font-medium ${session.name === 'Race' ? 'text-primary' : 'text-foreground/80'}`}>{session.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium text-foreground">
                                            {formatTime(session.date, "EEE, MMM d", config.timezone)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(session.date, "HH:mm", config.timezone)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground py-10">
                            Loading race data...
                        </div>
                    )}
                </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="drivers" className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
                <div className="px-2 pb-2">
                    <Table>
                    <TableHeader className="bg-transparent border-b border-border/40">
                        <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[40px] text-muted-foreground/70">#</TableHead>
                        <TableHead className="text-muted-foreground/70">Driver</TableHead>
                        <TableHead className="text-right text-muted-foreground/70">Pts</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {driverStandings.map((driver) => (
                        <TableRow key={driver.position} className="border-border/20 hover:bg-white/5">
                            <TableCell className="font-medium text-muted-foreground">{driver.position}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{driver.driver.name} {driver.driver.surname}</span>
                                    <span className="text-xs text-primary/80">{driver.team.teamName}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-foreground/80">{driver.points}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="constructors" className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full">
                <div className="px-2 pb-2">
                    <Table>
                    <TableHeader className="bg-transparent border-b border-border/40">
                        <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[40px] text-muted-foreground/70">#</TableHead>
                        <TableHead className="text-muted-foreground/70">Team</TableHead>
                        <TableHead className="text-right text-muted-foreground/70">Pts</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {constructorStandings.map((team) => (
                        <TableRow key={team.position} className="border-border/20 hover:bg-white/5">
                            <TableCell className="font-medium text-muted-foreground">{team.position}</TableCell>
                            <TableCell className="font-medium">{team.team.teamName}</TableCell>
                            <TableCell className="text-right font-mono text-foreground/80">{team.points}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

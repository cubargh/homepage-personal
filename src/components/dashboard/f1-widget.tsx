"use client";

import useSWR from "swr";
import { format, parseISO } from "date-fns";
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
import { Flag, Calendar } from "lucide-react";
import { 
  F1ApiNextResponse, 
  F1ApiDriverChampionshipResponse, 
  F1ApiConstructorChampionshipResponse 
} from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function F1Widget() {
  const { data: nextRaceResponse } = useSWR<F1ApiNextResponse>(
    "/api/f1?path=current/next",
    fetcher
  );
  
  const { data: driverData } = useSWR<F1ApiDriverChampionshipResponse>(
    "/api/f1?path=current/drivers-championship",
    fetcher
  );
  
  const { data: constructorData } = useSWR<F1ApiConstructorChampionshipResponse>(
    "/api/f1?path=current/constructors-championship",
    fetcher
  );

  const nextRace = nextRaceResponse?.race?.[0];
  const driverStandings = driverData?.drivers_championship || [];
  const constructorStandings = constructorData?.constructors_championship || [];

  return (
    <Card className="h-full flex flex-col border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-primary">
          <Flag className="h-5 w-5" />
          <span>Formula 1</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
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
                <div className="p-6 space-y-4">
                    {nextRace ? (
                    <div className="space-y-6">
                        <div className="space-y-1 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{nextRaceResponse?.season} Season • Round {nextRace.round}</p>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{nextRace.raceName}</h3>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center space-x-2 text-primary mb-1">
                                <Calendar className="h-5 w-5" />
                                <span className="text-lg font-medium">
                                    {format(parseISO(`${nextRace.schedule.race.date}T${nextRace.schedule.race.time}`), "MMMM d, HH:mm")}
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-foreground/90">{nextRace.circuit.circuitName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {nextRace.circuit.city}, {nextRace.circuit.country}
                                </p>
                            </div>
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

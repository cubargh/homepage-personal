"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addDays,
  addWeeks,
  subWeeks,
  subDays
} from "date-fns";
import { CalendarEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, List, LayoutGrid, Columns, Rows } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch calendar data');
  return res.json();
};

interface CalendarWidgetProps {
  config: {
    refreshInterval: number;
    timezone: string;
  };
}

const CALENDAR_COLORS = [
  "bg-primary/50 border-primary", // Cyan (Default)
  "bg-orange-500/50 border-orange-500", 
  "bg-green-500/50 border-green-500",
  "bg-purple-500/50 border-purple-500",
  "bg-pink-500/50 border-pink-500",
  "bg-yellow-500/50 border-yellow-500",
];

const CALENDAR_TEXT_COLORS = [
  "text-primary", // Cyan (Default)
  "text-orange-500", 
  "text-green-500",
  "text-purple-500",
  "text-pink-500",
  "text-yellow-500",
];

export function CalendarWidget({ config }: CalendarWidgetProps) {
  const [view, setView] = useState("agenda");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data, isLoading, error } = useSWR<{ events: (CalendarEvent & { calendarIndex: number })[] }>(
    "/api/calendar",
    fetcher,
    { refreshInterval: config.refreshInterval }
  );

  const events = useMemo(() => {
    if (!data?.events) return [];
    // Ensure dates are Date objects and adjusted for timezone if necessary (though ICS is usually UTC/local handled by backend)
    return data.events.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end)
    }));
  }, [data]);

  // Navigation handlers
  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  // Helper to format date in user's timezone
  const formatInTz = (date: Date, fmt: string) => formatTime(date, fmt, config.timezone);

  // View Renderers
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Header Row
    const header = weekDays.map(d => (
      <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">
        {d}
      </div>
    ));

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayEvents = events.filter(e => isSameDay(e.start, cloneDay));
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[40px] md:min-h-[50px] p-1 border-t border-r border-border/30 flex flex-col items-center md:items-start relative group",
              !isCurrentMonth && "bg-secondary/10 text-muted-foreground/50",
              i === 6 && "border-r-0" // Remove right border for last col
            )}
            onClick={() => {
                setCurrentDate(cloneDay);
                setView("day");
            }}
          >
            <span className={cn(
              "text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center mb-1",
              isToday && "bg-primary text-primary-foreground font-bold"
            )}>
              {formattedDate}
            </span>
            <div className="flex flex-col gap-0.5 w-full px-0.5">
                {dayEvents.slice(0, 3).map((e, idx) => (
                    <div 
                        key={e.id + idx} 
                        className={cn(
                            "text-[8px] truncate w-full px-1 rounded-sm hidden md:block text-foreground",
                            CALENDAR_COLORS[e.calendarIndex % CALENDAR_COLORS.length].replace("border-", "") // Use bg color only
                        )}
                    >
                        {e.summary}
                    </div>
                ))}
                {/* Mobile Dot indicator */}
                {dayEvents.length > 0 && (
                    <div className={cn("md:hidden h-1 w-1 rounded-full mx-auto", CALENDAR_COLORS[dayEvents[0].calendarIndex % CALENDAR_COLORS.length].replace("bg-", "bg-").split(" ")[0])} />
                )}
                {dayEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground pl-1 hidden md:block">+{dayEvents.length - 3} more</span>
                )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 mb-1 border-b border-border/30">{header}</div>
            <div className="flex-1 overflow-y-auto border-l border-border/30">
                {rows}
            </div>
        </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = eachDayOfInterval({
        start: startDate,
        end: addDays(startDate, 6)
    });

    return (
        <div className="grid grid-cols-7 h-full divide-x divide-border/30">
            {days.map(day => {
                const isToday = isSameDay(day, new Date());
                const dayEvents = events.filter(e => isSameDay(e.start, day));
                
                return (
                    <div key={day.toString()} className="flex flex-col h-full">
                        <div className={cn(
                            "p-2 text-center border-b border-border/30",
                            isToday && "bg-primary/10"
                        )}>
                            <div className="text-[10px] uppercase text-muted-foreground">{formatInTz(day, "EEE")}</div>
                            <div className={cn("text-sm font-bold", isToday && "text-primary")}>{formatInTz(day, "d")}</div>
                        </div>
                        <ScrollArea className="flex-1 p-1">
                            <div className="flex flex-col gap-1">
                                {dayEvents.map(e => (
                                    <div 
                                        key={e.id} 
                                        className={cn(
                                            "text-[9px] p-1 bg-secondary/30 rounded border-l-2 truncate",
                                            CALENDAR_COLORS[e.calendarIndex % CALENDAR_COLORS.length].split(" ")[1] // Use border color
                                        )} 
                                        title={`${e.summary} (${formatInTz(e.start, 'HH:mm')})`}
                                    >
                                        <div className="font-medium truncate">{e.summary}</div>
                                        {!e.allDay && <div className="text-muted-foreground">{formatInTz(e.start, 'HH:mm')}</div>}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(e => isSameDay(e.start, currentDate)).sort((a, b) => a.start.getTime() - b.start.getTime());
    
    return (
        <ScrollArea className="h-full px-4">
            <div className="space-y-3 py-4">
                {dayEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">No events scheduled for this day.</div>
                ) : (
                    dayEvents.map(e => (
                        <div key={e.id} className="flex gap-4 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-secondary/10 transition-colors">
                            <div className={cn("flex flex-col items-center justify-center min-w-[60px] text-muted-foreground border-r border-border/30 pr-4", CALENDAR_TEXT_COLORS[e.calendarIndex % CALENDAR_TEXT_COLORS.length])}>
                                {e.allDay ? (
                                    <span className="text-xs font-medium">All Day</span>
                                ) : (
                                    <>
                                        <span className="text-sm font-bold">{formatInTz(e.start, 'HH:mm')}</span>
                                        <span className="text-xs opacity-80">{formatInTz(e.end, 'HH:mm')}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{e.summary}</h4>
                                {e.location && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1 truncate">
                                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                        {e.location}
                                    </div>
                                )}
                                {e.description && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{e.description}</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
  };

  const renderAgendaView = () => {
    // Filter future events
    const now = new Date();
    const upcomingEvents = events.filter(e => e.end >= now).sort((a, b) => a.start.getTime() - b.start.getTime());

    return (
        <ScrollArea className="h-full px-4">
            <div className="space-y-1 py-2">
                {upcomingEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">No upcoming events.</div>
                ) : (
                    upcomingEvents.map((e, i) => {
                        const showDateHeader = i === 0 || !isSameDay(upcomingEvents[i-1].start, e.start);
                        return (
                            <div key={e.id}>
                                {showDateHeader && (
                                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mt-2 mb-1 border-b border-border/30 flex items-center text-xs font-medium text-muted-foreground">
                                        <span className={cn("mr-2 font-bold", isSameDay(e.start, now) && "text-primary")}>
                                            {isSameDay(e.start, now) ? "Today" : formatInTz(e.start, "EEEE, MMMM d")}
                                        </span>
                                    </div>
                                )}
                                <div className="flex gap-3 p-2 rounded hover:bg-secondary/10 transition-colors items-center">
                                    <div className={cn("w-1 h-8 rounded-full shrink-0", CALENDAR_COLORS[e.calendarIndex % CALENDAR_COLORS.length].split(" ")[0])} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="font-medium text-sm truncate max-w-[80%]" title={e.summary}>{e.summary}</span>
                                            {!e.allDay && (
                                                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                                                    {formatInTz(e.start, "HH:mm")}
                                                </span>
                                            )}
                                        </div>
                                        {e.location && <span className="text-[10px] text-muted-foreground truncate">{e.location}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
  };

  return (
    <Card className="h-full flex flex-col border-border/50 overflow-hidden">
      <CardHeader className="p-3 border-b border-border/50 bg-secondary/5 shrink-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
                <CalendarIcon className="h-5 w-5" />
                <CardTitle className="text-base">Calendar</CardTitle>
            </div>
            
            <div className={cn("flex items-center gap-1 bg-secondary/20 rounded-md p-0.5", view === "agenda" && "invisible")}>
                <button onClick={prev} className="p-1 hover:bg-secondary/40 rounded"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs font-medium min-w-[100px] text-center">
                    {view === "month" && format(currentDate, "MMMM yyyy")}
                    {view === "week" && `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d")}`}
                    {view === "day" && format(currentDate, "MMM d, yyyy")}
                    {view === "agenda" && format(currentDate, "MMMM yyyy")}
                </span>
                <button onClick={next} className="p-1 hover:bg-secondary/40 rounded"><ChevronRight className="h-4 w-4" /></button>
            </div>
        </div>
        <div className="mt-2">
            <Tabs value={view} onValueChange={setView} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-7 bg-secondary/30">
                    <TabsTrigger value="agenda" className="text-[10px] h-full px-1"><List className="h-3 w-3 mr-1 md:mr-2" /> Agenda</TabsTrigger>
                    <TabsTrigger value="day" className="text-[10px] h-full px-1"><Rows className="h-3 w-3 mr-1 md:mr-2" /> Day</TabsTrigger>
                    <TabsTrigger value="week" className="text-[10px] h-full px-1"><Columns className="h-3 w-3 mr-1 md:mr-2" /> Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-[10px] h-full px-1"><LayoutGrid className="h-3 w-3 mr-1 md:mr-2" /> Month</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden min-h-0 relative">
        {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading calendar...</div>
        ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive text-sm">Failed to load calendar</div>
        ) : (
            <>
                {view === "month" && renderMonthView()}
                {view === "week" && renderWeekView()}
                {view === "day" && renderDayView()}
                {view === "agenda" && renderAgendaView()}
            </>
        )}
      </CardContent>
    </Card>
  );
}

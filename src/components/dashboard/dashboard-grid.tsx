"use client";

import React, { useState, useEffect, useRef } from "react";
import { Responsive, Layout } from "react-grid-layout";
import { DashboardConfig, WidgetConfig } from "@/types";
import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { SportsWidget } from "@/components/dashboard/sports-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";

// Map widget types to their components
const WIDGET_COMPONENTS = {
  "service-monitor": ServiceWidget,
  "f1": F1Widget,
  "football": FootballWidget,
  "weather": WeatherWidget,
  "sports": SportsWidget,
  "calendar": CalendarWidget,
} as const;

interface DashboardGridProps {
  dashboardConfig: DashboardConfig;
}

export function DashboardGrid({ dashboardConfig }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(1200);
  const [rowHeight, setRowHeight] = useState(100);
  const [gridCols, setGridCols] = useState(10);
  const [colWidth, setColWidth] = useState(100); // Added explicit state for colWidth
  const [isDragging, setIsDragging] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: [],
  });

  // Calculate dynamic row height and width using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        setWidth(newWidth);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Update row height and col width whenever width or gridCols changes
  useEffect(() => {
    const margin = 10;
    const cols = gridCols;
    // RGL Width Formula: (containerWidth - (margin * (cols - 1))) / cols
    const cellWidth = (width - (margin * (cols - 1))) / cols;
    
    setColWidth(cellWidth);
    setRowHeight(cellWidth); // Keep it square
  }, [width, gridCols]);

  const onBreakpointChange = (breakpoint: string, cols: number) => {
    setGridCols(cols);
  };

  // Load layout from local storage or generate default
  useEffect(() => {
    setMounted(true);
    const savedLayouts = localStorage.getItem("dashboard-layouts");
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (parsedLayouts && typeof parsedLayouts === 'object') {
           setLayouts(parsedLayouts);
           return;
        }
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    }

    // Generate default layout based on config if no saved layout
    const defaultLayout = dashboardConfig.widgets.map((widget) => {
      let x = 0;
      let y = 0;
      let w = 3;
      let h = widget.rowSpan ?? 2;

      if (widget.id === "weather") { x = 0; y = 0; w = 3; h = 2; }
      else if (widget.id === "services") { x = 0; y = 2; w = 3; h = 2; }
      else if (widget.id === "calendar") { x = 3; y = 0; w = 4; h = 4; }
      else if (widget.id === "sports-combined") { x = 7; y = 0; w = 3; h = 4; }
      else {
          w = widget.colSpan ? Math.round(widget.colSpan * 3.33) : 3;
          h = widget.rowSpan ?? 2;
          x = (widget.x ?? 0);
          y = widget.y ?? 0;
      }

      return {
        i: widget.id,
        x,
        y,
        w,
        h,
      };
    });

    setLayouts({
      lg: defaultLayout,
      md: defaultLayout.map(l => ({ ...l, w: Math.min(l.w, 6) })), 
      sm: defaultLayout.map(l => ({ ...l, w: 4, x: 0 })), 
      xs: defaultLayout.map(l => ({ ...l, w: 4, x: 0 })),
      xxs: defaultLayout.map(l => ({ ...l, w: 4, x: 0 })),
    });
  }, [dashboardConfig.widgets]);

  const onLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
    localStorage.setItem("dashboard-layouts", JSON.stringify(allLayouts));
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = () => setIsDragging(false);
  const handleResizeStart = () => setIsDragging(true);
  const handleResizeStop = () => setIsDragging(false);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  // Render background grid cells explicitly
  const renderGridBackground = () => {
    const margin = 10;
    const cols = gridCols;
    // Use state colWidth for rendering background
    
    // Create an array for columns
    const colElements = [];
    for (let i = 0; i < cols; i++) {
       colElements.push(
          <div 
            key={i}
            className="h-full bg-white/5"
            style={{
               position: 'absolute',
               top: 0,
               bottom: 0,
               left: `${i * (colWidth + margin)}px`,
               width: `${colWidth}px`
            }}
          />
       );
    }

    return (
       <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ease-in-out ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
           {/* Columns */}
           {colElements}
           
           {/* Rows - using gradient for infinite height support */}
           <div 
             className="absolute inset-0"
             style={{
                backgroundImage: `linear-gradient(to bottom, transparent ${rowHeight}px, rgba(255,255,255,0.1) ${rowHeight}px, rgba(255,255,255,0.1) ${rowHeight + margin}px, transparent ${rowHeight + margin}px)`,
                backgroundSize: `100% ${rowHeight + margin}px`
             }}
           />
       </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative min-h-screen ${isDragging ? 'grid-active' : ''}`}>
      {renderGridBackground()}
      <Responsive
        className="layout z-10"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 10, md: 8, sm: 4, xs: 4, xxs: 4 }}
        rowHeight={rowHeight}
        width={width}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        isDraggable={true}
        isResizable={true}
        margin={[10, 10]}
        containerPadding={{ lg: [0, 0], md: [0, 0], sm: [0, 0], xs: [0, 0], xxs: [0, 0] }}
      >
        {dashboardConfig.widgets.map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type as keyof typeof WIDGET_COMPONENTS];
          if (!WidgetComponent) return null;

          let props = {};
          if (widget.type === "service-monitor") {
            props = { services: dashboardConfig.services, config: dashboardConfig.monitoring };
          } else if (widget.type === "sports") {
            props = {
              f1Config: { ...dashboardConfig.f1, timezone: dashboardConfig.timezone },
              footballConfig: { ...dashboardConfig.football, timezone: dashboardConfig.timezone },
            };
          } else if (widget.type === "weather") {
            props = { config: { ...dashboardConfig.weather, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "calendar") {
            props = { config: { ...dashboardConfig.calendar, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "f1") {
            props = { config: { ...dashboardConfig.f1, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "football") {
            props = { config: { ...dashboardConfig.football, timezone: dashboardConfig.timezone } };
          }

          return (
            <div key={widget.id} className="relative h-full w-full overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm border border-border">
              <div className="h-full w-full select-none">
                  <WidgetComponent {...props as any} />
              </div>
            </div>
          );
        })}
      </Responsive>
    </div>
  );
}

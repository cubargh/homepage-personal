"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Responsive, Layout, Layouts } from "react-grid-layout";
import { DashboardConfig, WidgetConfig, WidgetType } from "@/types";
import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { SportsWidget } from "@/components/dashboard/sports-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { GridBackground } from "@/components/dashboard/grid-background";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
import { WidgetErrorBoundary } from "@/components/dashboard/error-boundary";
import { GridSkeleton } from "@/components/dashboard/grid-skeleton";
import { generateLayouts } from "@/lib/layout-utils";
import { GRID_BREAKPOINTS, GRID_COLS, GRID_MARGIN, TARGET_CELL_WIDTH } from "@/config/grid";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<any>> = {
  "service-monitor": ServiceWidget,
  "f1": F1Widget,
  "football": FootballWidget,
  "weather": WeatherWidget,
  "sports": SportsWidget,
  "calendar": CalendarWidget,
};

interface DashboardGridProps {
  dashboardConfig: DashboardConfig;
}

// Container padding to match Skeleton
const CONTAINER_PADDING: [number, number] = [10, 10];

export function DashboardGrid({ dashboardConfig }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(1200);
  const [rowHeight, setRowHeight] = useState(100);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("lg");
  const [gridCols, setGridCols] = useState(GRID_COLS.lg);
  const [responsiveCols, setResponsiveCols] = useState(GRID_COLS);
  const [colWidth, setColWidth] = useState(100);
  
  // Track active interactions
  const [isGridActive, setIsGridActive] = useState(false); // Dragging or Resizing anything (for background)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null); // Specific widget being interacted with
  const [isResizing, setIsResizing] = useState(false); // Specific state for resizing action

  // Memoize initial layouts based on config
  const defaultLayouts = useMemo(() => generateLayouts(dashboardConfig), [dashboardConfig]);
  
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Initialize and Load Layouts
  useEffect(() => {
    setMounted(true);
    // Initialize width immediately if ref is available
    if (containerRef.current) {
      setWidth(Math.floor(containerRef.current.getBoundingClientRect().width));
    } else if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
    }

    const savedLayouts = localStorage.getItem("dashboard-layouts");
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (parsedLayouts && typeof parsedLayouts === 'object') {
           // Migration logic
           if (parsedLayouts.desktop) {
               parsedLayouts.lg = parsedLayouts.desktop;
               delete parsedLayouts.desktop;
           }
           if (parsedLayouts.mobile) {
               parsedLayouts.sm = parsedLayouts.mobile;
               delete parsedLayouts.mobile;
           }
           
           const lgItems = parsedLayouts.lg || [];
           const maxRight = Math.max(...lgItems.map((l: any) => (l.x || 0) + (l.w || 0)), 0);
           
           if (maxRight <= 10 && lgItems.length > 0) {
               console.log("Detected old 10-col layout, migrating to 20-col...");
               const migratedLayouts: Layouts = {};
               for (const bp in parsedLayouts) {
                   migratedLayouts[bp] = parsedLayouts[bp].map((l: any) => ({
                       ...l,
                       x: l.x * 2,
                       y: l.y * 2,
                       w: l.w * 2,
                       h: l.h * 2
                   }));
               }
               setLayouts(migratedLayouts);
           } else {
               setLayouts(parsedLayouts);
           }
        }
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    }
  }, []);

  // Calculate dynamic dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (containerRef.current) {
         let newWidth = Math.floor(containerRef.current.getBoundingClientRect().width);
         // Fallback to window width if container width is 0 (can happen on initial mount)
         if (newWidth === 0 && typeof window !== 'undefined') {
             newWidth = window.innerWidth;
         }
         setWidth(newWidth);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for ResizeObserver, but verify it's not 0
        const entryWidth = Math.floor(entry.contentRect.width);
        if (entryWidth > 0) {
            setWidth(entryWidth);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    measure();
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Update metrics when width or breakpoint changes
  useEffect(() => {
    const margin = GRID_MARGIN[0];
    const paddingX = CONTAINER_PADDING[0] * 2;

    // Calculate dynamic columns based on width and target cell size
    // We only apply dynamic columns for the 'lg' (desktop) breakpoint
    let lgCols = GRID_COLS.lg;
    
    // Logic: If width allows, calculate how many TARGET_CELL_WIDTH columns fit
    // We consider 'lg' to be anything larger than sm, but we want dynamic columns everywhere above sm
    if (width >= GRID_BREAKPOINTS.lg || width > 768) {
        const availableWidth = width - paddingX;
        // Formula: cols = (available + margin) / (cellWidth + margin)
        lgCols = Math.floor((availableWidth + margin) / (TARGET_CELL_WIDTH + margin));
        // Ensure we don't go below a reasonable desktop minimum (e.g. 10)
        lgCols = Math.max(10, lgCols);
    }

    const newResponsiveCols = {
        lg: lgCols,
        sm: GRID_COLS.sm
    };
    
    // Determine active columns based on current breakpoint
    const activeCols = newResponsiveCols[currentBreakpoint as 'lg' | 'sm'] || lgCols;

    // Recalculate cell width to fill space exactly
    const cellWidth = (width - paddingX - (margin * (activeCols - 1))) / activeCols;
    
    setResponsiveCols(newResponsiveCols);
    setGridCols(activeCols);
    setColWidth(cellWidth);
    setRowHeight(cellWidth); // Keep it square-ish
  }, [width, currentBreakpoint]);

  const onBreakpointChange = useCallback((breakpoint: string, cols: number) => {
    setCurrentBreakpoint(breakpoint);
    setGridCols(cols);
  }, []);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    localStorage.setItem("dashboard-layouts", JSON.stringify(allLayouts));
  }, []);

  // RGL Event Handlers
  const onDragStart = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    setIsGridActive(true);
    setActiveWidgetId(newItem.i);
  }, []);

  const onDragStop = useCallback(() => {
    setIsGridActive(false);
    setActiveWidgetId(null);
  }, []);

  const onResizeStart = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    setIsGridActive(true);
    setActiveWidgetId(newItem.i);
    setIsResizing(true);
  }, []);

  const onResizeStop = useCallback(() => {
    setIsGridActive(false);
    setActiveWidgetId(null);
    setIsResizing(false);
  }, []);

  // Widget Props Factory
  const getWidgetProps = useCallback((widget: WidgetConfig) => {
    const common = { timezone: dashboardConfig.timezone };
    
    switch (widget.type) {
      case "service-monitor":
        return { services: dashboardConfig.services, config: dashboardConfig.monitoring };
      case "sports":
        return {
          f1Config: { ...dashboardConfig.f1, ...common },
          footballConfig: { ...dashboardConfig.football, ...common },
        };
      case "weather":
        return { config: { ...dashboardConfig.weather, ...common } };
      case "calendar":
        return { config: { ...dashboardConfig.calendar, ...common } };
      case "f1":
        return { config: { ...dashboardConfig.f1, ...common } };
      case "football":
        return { config: { ...dashboardConfig.football, ...common } };
      default:
        return {};
    }
  }, [dashboardConfig]);

  if (!mounted) {
    return <GridSkeleton config={dashboardConfig} />;
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div ref={containerRef} className="relative min-h-screen w-full">
        {/* Render Skeleton if not mounted or loading, but keep it in the same container context */}
        {!mounted ? (
           <GridSkeleton config={dashboardConfig} />
        ) : (
          <>
            <GridBackground 
              cols={gridCols}
              colWidth={colWidth}
              rowHeight={rowHeight}
              show={isGridActive}
              padding={CONTAINER_PADDING}
            />
            
            <Responsive
              className="layout z-10"
              layouts={layouts}
              breakpoints={GRID_BREAKPOINTS}
              cols={responsiveCols}
              rowHeight={rowHeight}
              width={width}
              onLayoutChange={onLayoutChange}
              onBreakpointChange={onBreakpointChange}
              
              // Drag/Resize Handlers
              onDragStart={onDragStart}
              onDragStop={onDragStop}
              onResizeStart={onResizeStart}
              onResizeStop={onResizeStop}
              
              // Always Draggable/Resizable
              isDraggable={true}
              isResizable={true}
              draggableCancel=".no-drag"
              
              // Visuals
              margin={GRID_MARGIN}
              containerPadding={{ 
                 lg: CONTAINER_PADDING,
                 sm: CONTAINER_PADDING
              }}
              useCSSTransforms={true}
            >
              {dashboardConfig.widgets.map((widget) => {
                const WidgetComponent = WIDGET_COMPONENTS[widget.type];
                if (!WidgetComponent) return null;

                const isActive = widget.id === activeWidgetId;

                return (
                  <WidgetWrapper 
                    key={widget.id} 
                    isActive={isActive}
                    isResizing={isActive && isResizing}
                    className="pointer-events-auto" 
                  >
                    <WidgetErrorBoundary>
                      <WidgetComponent {...getWidgetProps(widget)} />
                    </WidgetErrorBoundary>
                  </WidgetWrapper>
                );
              })}
            </Responsive>
            
            {/* Debug Overlay */}
            <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md z-50 font-mono text-sm pointer-events-none border border-white/20">
               <div>Width: {width}px</div>
               <div>Cols: {gridCols} (Target: {Math.floor((width - 20) / 70)})</div>
               <div>Breakpoint: {currentBreakpoint}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

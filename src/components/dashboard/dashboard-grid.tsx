"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import {
  GRID_BREAKPOINTS,
  GRID_COLS,
  GRID_MARGIN,
  TARGET_CELL_WIDTH,
} from "@/config/grid";

const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<any>> = {
  "service-monitor": ServiceWidget,
  f1: F1Widget,
  football: FootballWidget,
  weather: WeatherWidget,
  sports: SportsWidget,
  calendar: CalendarWidget,
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

  // Calculate responsive columns purely based on width
  const activeCols = useMemo(() => {
    const margin = GRID_MARGIN[0];
    const paddingX = CONTAINER_PADDING[0] * 2;
    let cols = GRID_COLS.lg;

    if (width >= GRID_BREAKPOINTS.lg || width > 768) {
      const availableWidth = width - paddingX;
      cols = Math.floor(
        (availableWidth + margin) / (TARGET_CELL_WIDTH + margin)
      );
      cols = Math.max(10, cols);
    }
    return cols;
  }, [width]);

  const responsiveCols = useMemo(
    () => ({
      lg: activeCols,
      sm: GRID_COLS.sm,
    }),
    [activeCols]
  );

  // Determine current column count for background grid
  const gridCols = currentBreakpoint === "sm" ? GRID_COLS.sm : activeCols;

  // Calculate cell width
  const colWidth = useMemo(() => {
    const margin = GRID_MARGIN[0];
    const paddingX = CONTAINER_PADDING[0] * 2;
    return (width - paddingX - margin * (gridCols - 1)) / gridCols;
  }, [width, gridCols]);

  // Update row height when colWidth changes
  useEffect(() => {
    setRowHeight(colWidth);
  }, [colWidth]);

  // Track active interactions
  const [isGridActive, setIsGridActive] = useState(false); // Dragging or Resizing anything (for background)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null); // Specific widget being interacted with
  const [isResizing, setIsResizing] = useState(false); // Specific state for resizing action

  // Settings & Visibility State
  const showDebug = dashboardConfig.debug || false;

  // Memoize initial layouts based on config
  const defaultLayouts = useMemo(
    () => generateLayouts(dashboardConfig),
    [dashboardConfig]
  );

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Initialize and Load Layouts & Settings
  useEffect(() => {
    let initialWidth = 1200;
    // Initialize width immediately if ref is available
    if (containerRef.current) {
      initialWidth = Math.floor(
        containerRef.current.getBoundingClientRect().width
      );
    } else if (typeof window !== "undefined") {
      initialWidth = window.innerWidth;
    }
    setWidth(initialWidth);

    // Load Settings
    // (Removed local storage logic for debug/visibility as it is now config-driven)

    const savedLayouts = localStorage.getItem("dashboard-layouts");
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (parsedLayouts && typeof parsedLayouts === "object") {
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
          const maxRight = Math.max(
            ...lgItems.map((l: any) => (l.x || 0) + (l.w || 0)),
            0
          );

          if (maxRight <= 10 && lgItems.length > 0) {
            console.log("Detected old 10-col layout, migrating to 20-col...");
            const migratedLayouts: Layouts = {};
            for (const bp in parsedLayouts) {
              migratedLayouts[bp] = parsedLayouts[bp].map((l: any) => ({
                ...l,
                x: l.x * 2,
                y: l.y * 2,
                w: l.w * 2,
                h: l.h * 2,
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

    // ONLY set mounted after we have loaded everything AND set the width
    // However, we must ensure that the layout state is also ready and matches the new width if possible.
    // But since RGL handles the layout reflow based on width, we just need to ensure
    // we don't render with DEFAULT width if real width is available.

    setMounted(true);
  }, [dashboardConfig]); // Added dashboardConfig dependency just in case, though mostly static.

  // Calculate dynamic dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (containerRef.current) {
        let newWidth = Math.floor(
          containerRef.current.getBoundingClientRect().width
        );
        // Fallback to window width if container width is 0 (can happen on initial mount)
        if (newWidth === 0 && typeof window !== "undefined") {
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
    // Do NOT call measure() here again as we did it in the mount effect
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Update metrics when width or breakpoint changes -> MOVED TO USEMEMO ABOVE

  const onBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
    // setGridCols(cols); -> Derived now
  }, []);

  const onLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      // Check if any visible widgets are missing from currentLayout (which happens when they are hidden and re-added)
      // If a widget was hidden and is now visible, it might be added at (0,0) by RGL if not in layout.
      // We should try to preserve its last known position from `layouts` if possible,
      // or let RGL handle it but ensure we save the state correctly.

      // Merge new positions into state
      setLayouts((prevLayouts) => {
        const newLayouts = { ...prevLayouts, ...allLayouts };
        // Also persist to localStorage
        localStorage.setItem("dashboard-layouts", JSON.stringify(newLayouts));
        return newLayouts;
      });
    },
    []
  );

  // Settings Handlers
  // (Removed toggleWidget and toggleDebug as they are no longer used)

  // RGL Event Handlers
  const onDragStart = useCallback(
    (
      _layout: Layout[],
      _oldItem: Layout,
      newItem: Layout,
      _placeholder: Layout,
      _e: MouseEvent,
      _element: HTMLElement
    ) => {
      setIsGridActive(true);
      setActiveWidgetId(newItem.i);
    },
    []
  );

  const onDragStop = useCallback(() => {
    setIsGridActive(false);
    setActiveWidgetId(null);
  }, []);

  const onResizeStart = useCallback(
    (
      _layout: Layout[],
      _oldItem: Layout,
      newItem: Layout,
      _placeholder: Layout,
      _e: MouseEvent,
      _element: HTMLElement
    ) => {
      setIsGridActive(true);
      setActiveWidgetId(newItem.i);
      setIsResizing(true);
    },
    []
  );

  const onResizeStop = useCallback(() => {
    setIsGridActive(false);
    setActiveWidgetId(null);
    setIsResizing(false);
  }, []);

  // Widget Props Factory
  const getWidgetProps = useCallback(
    (widget: WidgetConfig) => {
      const common = { timezone: dashboardConfig.timezone };

      switch (widget.type) {
        case "service-monitor":
          return {
            services: dashboardConfig.services,
            config: dashboardConfig.monitoring,
          };
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
    },
    [dashboardConfig]
  );

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
              draggableCancel=".no-drag, button, a, input, textarea, select, [role='button']"
              // Visuals
              margin={GRID_MARGIN}
              containerPadding={{
                lg: CONTAINER_PADDING,
                sm: CONTAINER_PADDING,
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
            {showDebug && (
              <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md z-50 font-mono text-sm pointer-events-none border border-white/20">
                <div>Width: {width}px</div>
                <div>
                  Cols: {gridCols} (Target: {Math.floor((width - 20) / 70)})
                </div>
                <div>Breakpoint: {currentBreakpoint}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

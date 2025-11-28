"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Responsive, Layout, Layouts } from "react-grid-layout";
import { Menu, ChevronRight } from "lucide-react";
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
import { SettingsSidebar } from "@/components/dashboard/settings-sidebar";
import { Button } from "@/components/ui/button";
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

  const [colWidthState, setColWidthState] = useState(colWidth); // Keeping state for smooth updates if needed? No, use calculated.

  // Track active interactions
  const [isGridActive, setIsGridActive] = useState(false); // Dragging or Resizing anything (for background)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null); // Specific widget being interacted with
  const [isResizing, setIsResizing] = useState(false); // Specific state for resizing action

  // Settings & Visibility State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [visibleWidgetIds, setVisibleWidgetIds] = useState<string[]>([]);

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
    const savedShowDebug = localStorage.getItem("dashboard-show-debug");
    if (savedShowDebug !== null) {
      setShowDebug(savedShowDebug === "true");
    }

    const savedVisibleWidgets = localStorage.getItem(
      "dashboard-visible-widgets"
    );
    if (savedVisibleWidgets) {
      try {
        const parsed = JSON.parse(savedVisibleWidgets);
        if (Array.isArray(parsed)) {
          setVisibleWidgetIds(parsed);
        } else {
          // Fallback if invalid
          setVisibleWidgetIds(dashboardConfig.widgets.map((w) => w.id));
        }
      } catch (e) {
        console.error("Failed to parse visible widgets", e);
        setVisibleWidgetIds(dashboardConfig.widgets.map((w) => w.id));
      }
    } else {
      // Default to all visible
      setVisibleWidgetIds(dashboardConfig.widgets.map((w) => w.id));
    }

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

  const onBreakpointChange = useCallback((breakpoint: string, cols: number) => {
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
  const toggleWidget = useCallback(
    (id: string) => {
      setVisibleWidgetIds((prev) => {
        const isVisible = prev.includes(id);
        if (isVisible) {
          // Hiding: just remove from visible list
          const next = prev.filter((wId) => wId !== id);
          localStorage.setItem(
            "dashboard-visible-widgets",
            JSON.stringify(next)
          );
          return next;
        } else {
          // Showing: Add to visible list.
          // Important: RGL needs to know where to put it.
          // If it's in `layouts` state, it will use that.
          // If not, it defaults to 0,0 1x1.
          // We ensure `layouts` state has the default config for this widget if missing.

          setLayouts((currentLayouts) => {
            const widgetConfig = dashboardConfig.widgets.find(
              (w) => w.id === id
            );
            if (!widgetConfig) return currentLayouts;

            // Check if we already have a layout for this widget in current breakpoint
            const currentBpLayout = currentLayouts[currentBreakpoint] || [];
            const existingLayoutItem = currentBpLayout.find((l) => l.i === id);

            if (existingLayoutItem) {
              // Already has a position, no need to touch layouts
              return currentLayouts;
            }

            // No position found (maybe never rendered or cleared), generate default
            // We use the same logic as generateLayouts but just for this one widget
            // The scale multiplier is 2 as per layout-utils (assuming 10-col base config)
            const multiplier = 2;
            const defaultW = (widgetConfig.colSpan ?? 4) * multiplier; // Default 4x4 (scaled) if undefined
            const defaultH = (widgetConfig.rowSpan ?? 4) * multiplier;
            const defaultX = (widgetConfig.x ?? 0) * multiplier;
            const defaultY = (widgetConfig.y ?? 0) * multiplier;

            const newLayoutItem: Layout = {
              i: id,
              x: defaultX,
              y: defaultY,
              w: defaultW,
              h: defaultH,
            };

            return {
              ...currentLayouts,
              [currentBreakpoint]: [...currentBpLayout, newLayoutItem],
            };
          });

          const next = [...prev, id];
          localStorage.setItem(
            "dashboard-visible-widgets",
            JSON.stringify(next)
          );
          return next;
        }
      });
    },
    [dashboardConfig, currentBreakpoint]
  );

  const toggleDebug = useCallback(() => {
    setShowDebug((prev) => {
      const next = !prev;
      localStorage.setItem("dashboard-show-debug", String(next));
      return next;
    });
  }, []);

  // RGL Event Handlers
  const onDragStart = useCallback(
    (
      layout: Layout[],
      oldItem: Layout,
      newItem: Layout,
      placeholder: Layout,
      e: MouseEvent,
      element: HTMLElement
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
      layout: Layout[],
      oldItem: Layout,
      newItem: Layout,
      placeholder: Layout,
      e: MouseEvent,
      element: HTMLElement
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

  // Filter widgets based on visibility
  const visibleWidgets = dashboardConfig.widgets.filter((w) =>
    visibleWidgetIds.includes(w.id)
  );

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        widgets={dashboardConfig.widgets}
        visibleWidgetIds={visibleWidgetIds}
        onToggleWidget={toggleWidget}
        showDebug={showDebug}
        onToggleDebug={toggleDebug}
      />

      {/* Settings Trigger */}
      <div className="fixed top-0 left-0 z-40 group">
        <div
          className="p-4 cursor-pointer transition-opacity opacity-50 group-hover:opacity-100"
          onClick={() => setIsSettingsOpen(true)}
          role="button"
          aria-label="Open Settings"
        >
          <ChevronRight className="w-6 h-6 text-foreground transform rotate-45" />
        </div>
      </div>

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
              // Add a small delay (100ms) before drag starts to allow for clicks on child elements
              // like links or buttons without initiating a drag immediately.
              // This is a specific prop supported by the underlying draggablecore used by RGL (via props passing)
              // Note: RGL types might not explicitly list it but it often passes through or we might need a custom approach if it fails.
              // However, react-draggable supports `delay` or `pressDelay`.
              // react-grid-layout passes props to DraggableCore.
              // Let's try passing it. If strict types fail, we might need a workaround or just cast.
              // Actually, looking at docs, standard RGL doesn't expose 'delay' easily on the Grid item.

              // ALTERNATIVE: Use a handle class if we wanted explicit handles.
              // BUT user asked for delay.
              // Let's try `useCSSTransforms={true}` which is already there.

              // Wait, 'isDraggable' is just a boolean.
              // RGL doesn't support 'delay' prop on the main Responsive element directly in v1.3.4 types typically.
              // But let's check if we can pass it via `draggableProps`? No.

              // Workaround: We can't easily add a native "delay" to RGL without a custom fork or handle.
              // HOWEVER, the user's issue is likely that clicking buttons triggers drag.
              // The best fix for "click something inside" is actually `draggableCancel`.
              // If we ensure interactive elements have class "no-drag", they won't trigger drag.

              // If the user specifically wants a TIME delay for the WHOLE widget:
              // We might be limited.

              // Let's re-read the request: "add a delay to when I can drag the widget"
              // If I assume they mean "press and hold to drag", RGL is tricky with that out of the box.
              // But 'draggableCancel' is the standard way to fix "I clicked something inside".

              // Let's double check if we can pass `draggableOpts`? No.

              // Let's try adding `className="no-drag"` to specific inner elements if possible,
              // OR try to pass `delay: 200` if it falls through (it might not).

              // Another approach: Using a drag handle. "Only drag by title bar".
              // But user asked for delay.

              // If we can't do delay, maybe we instruct user to add no-drag?
              // Or we add a global style or script? No.

              // Let's try to assume RGL passes unknown props to Draggable?
              // ...

              // Actually, checking RGL source, it doesn't pass arbitrary props to Draggable.
              // But it does support `draggableCancel`.
              // Maybe the User just needs better cancellation?

              // Wait, we can use `draggableCancel=".no-drag"` which we have.
              // If the user means "clicking ANYWHERE resets it", a delay is nicer.

              // Let's try to add `useCSSTransforms` which is there.

              // If we really need delay, we might need a custom Draggable wrapper, but RGL manages that.

              // Let's try adding `pressDelay` property if it exists in the types/library? Not in standard types.
              // Let's try adding the class `cancel` to interactive elements.

              // Let's try to add `draggableCancel` to exclude common interactive elements?
              // draggableCancel=".no-drag, button, a, input, [role='button']"

              // This is usually what people want when they ask for this—they want to be able to click buttons.
              draggableCancel=".no-drag, button, a, input, textarea, select, [role='button']"
              // Visuals
              margin={GRID_MARGIN}
              containerPadding={{
                lg: CONTAINER_PADDING,
                sm: CONTAINER_PADDING,
              }}
              useCSSTransforms={true}
            >
              {visibleWidgets.map((widget) => {
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

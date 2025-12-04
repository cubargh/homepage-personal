"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Responsive, Layout, Layouts } from "react-grid-layout";
import { DashboardConfig } from "@/types";
import { WidgetRegistry } from "@/lib/widget-registry";
import "@/config/widgets"; // Register widgets (client-side)

import { GridBackground } from "@/components/dashboard/grid-background";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
import { WidgetErrorBoundary } from "@/components/dashboard/error-boundary";
import { GridSkeleton } from "@/components/dashboard/grid-skeleton";
import { SettingsSidebar } from "@/components/dashboard/settings-sidebar";
import { generateLayouts } from "@/lib/layout-utils";
import {
  GRID_BREAKPOINTS,
  GRID_COLS,
  GRID_MARGIN,
  TARGET_CELL_WIDTH,
} from "@/config/grid";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface DashboardGridProps {
  dashboardConfig: DashboardConfig;
}

// Container padding to match Skeleton
const CONTAINER_PADDING: [number, number] = [10, 10];

export function DashboardGrid({ dashboardConfig }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [rowHeight, setRowHeight] = useState(100);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("lg");

  // Track active interactions
  const [isGridActive, setIsGridActive] = useState(false); // Dragging or Resizing anything (for background)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null); // Specific widget being interacted with
  const [isResizing, setIsResizing] = useState(false); // Specific state for resizing action

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const showDebug = dashboardConfig.debug || false;

  // Check if we should use default 2x2 sizes (when localStorage was just cleared)
  const useDefaultSizes =
    typeof window !== "undefined" &&
    sessionStorage.getItem("reset-to-default-sizes") === "true";

  // Memoize initial layouts based on config
  const defaultLayouts = useMemo(
    () => generateLayouts(dashboardConfig, useDefaultSizes),
    [dashboardConfig, useDefaultSizes]
  );

  // Clear the reset flag after using it
  useEffect(() => {
    if (useDefaultSizes) {
      sessionStorage.removeItem("reset-to-default-sizes");
    }
  }, [useDefaultSizes]);

  // Calculate required width from saved layouts to maintain column count
  const calculateWidthFromLayouts = (layouts: Layouts): number | null => {
    const lgItems = layouts.lg || [];
    if (lgItems.length === 0) return null;

    // Find the maximum column position used in saved layout
    const maxRight = Math.max(
      ...lgItems.map((l: any) => (l.x || 0) + (l.w || 0)),
      0
    );

    if (maxRight === 0) return null;

    // Calculate what width would produce this column count
    // Formula: cols = (width - paddingX + margin) / (TARGET_CELL_WIDTH + margin)
    // Solving for width: width = cols * (TARGET_CELL_WIDTH + margin) - margin + paddingX
    const margin = GRID_MARGIN[0];
    const paddingX = CONTAINER_PADDING[0] * 2;
    // Add 1 to account for Math.floor rounding down
    const requiredWidth =
      (maxRight + 1) * (TARGET_CELL_WIDTH + margin) - margin + paddingX;

    return Math.max(requiredWidth, GRID_BREAKPOINTS.lg);
  };

  // Load localStorage layouts synchronously before first render
  const loadSavedLayouts = (): {
    layouts: Layouts;
    savedWidth: number | null;
  } => {
    if (typeof window === "undefined") {
      return { layouts: defaultLayouts, savedWidth: null };
    }

    const savedLayouts = localStorage.getItem("dashboard-layouts");
    if (!savedLayouts) {
      return { layouts: defaultLayouts, savedWidth: null };
    }

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

        let finalLayouts: Layouts;
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
          finalLayouts = migratedLayouts;
        } else {
          finalLayouts = parsedLayouts;
        }

        // Calculate required width from the saved layouts
        const savedWidth = calculateWidthFromLayouts(finalLayouts);
        return { layouts: finalLayouts, savedWidth };
      }
    } catch (e) {
      console.error("Failed to parse saved layout", e);
    }

    return { layouts: defaultLayouts, savedWidth: null };
  };

  const { layouts: initialLayouts, savedWidth: initialSavedWidth } =
    loadSavedLayouts();
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);

  // Initialize width: use saved width if available, otherwise use viewport
  const getInitialWidth = (): number => {
    // If we have saved layouts, use the calculated width to maintain column count
    if (initialSavedWidth !== null) {
      return initialSavedWidth;
    }

    // Otherwise, use viewport width
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1200;
  };

  const [width, setWidth] = useState(getInitialWidth());

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

  // Initialize and Load Settings
  useEffect(() => {
    // If we didn't have saved layouts, measure container now
    if (initialSavedWidth === null && containerRef.current) {
      const measuredWidth = Math.floor(
        containerRef.current.getBoundingClientRect().width
      );
      if (measuredWidth > 0) {
        setWidth(measuredWidth);
      }
    }

    setMounted(true);
  }, [dashboardConfig, initialSavedWidth]);

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
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const onBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  const onLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts((prevLayouts) => {
        const newLayouts = { ...prevLayouts, ...allLayouts };
        // Also persist to localStorage
        localStorage.setItem("dashboard-layouts", JSON.stringify(newLayouts));
        return newLayouts;
      });
    },
    []
  );

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

  if (!mounted) {
    return <GridSkeleton config={dashboardConfig} />;
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
          className="shadow-lg"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <div ref={containerRef} className="relative min-h-screen w-full">
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
                const definition = WidgetRegistry.get(widget.type);
                const WidgetComponent = definition?.component;

                if (!WidgetComponent) {
                  console.warn(
                    `Widget type "${widget.type}" not found in registry`
                  );
                  return null;
                }

                const isActive = widget.id === activeWidgetId;

                // Get current grid dimensions
                const currentLayout = layouts[currentBreakpoint]?.find(
                  (l) => l.i === widget.id
                );
                const gridSize = currentLayout
                  ? { w: currentLayout.w, h: currentLayout.h }
                  : undefined;

                return (
                  <WidgetWrapper
                    key={widget.id}
                    isActive={isActive}
                    isResizing={isActive && isResizing}
                    className="pointer-events-auto"
                  >
                    <WidgetErrorBoundary>
                      <WidgetComponent {...widget.props} gridSize={gridSize} />
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

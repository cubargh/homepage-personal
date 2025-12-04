import { Layout, Layouts } from "react-grid-layout";
import { DashboardConfig } from "@/types";
import { GRID_COLS } from "@/config/grid";

/**
 * Generates the RGL layout object for a given dashboard configuration.
 * It respects the x, y, w, h values from the config for the 'lg' breakpoint,
 * and generates responsive layouts for smaller breakpoints.
 */
export function generateLayouts(config: DashboardConfig, useDefaultSize: boolean = false): Layouts {
  const lgLayout: Layout[] = config.widgets.map((widget, index) => {
    // Scale up default width/height/x/y from assumed 10-col baseline to new 20-col grid.
    const multiplier = 2;
    
    // If using default size, all widgets start at 2x2 in grid units
    if (useDefaultSize) {
      return {
        i: widget.id,
        x: (index % 10) * 2, // Arrange widgets in a grid, 2 columns apart
        y: Math.floor(index / 10) * 2, // Stack widgets vertically, 2 rows apart
        w: 2, // 2 columns wide
        h: 2, // 2 rows tall
      };
    }
    
    return {
      i: widget.id,
      x: (widget.x ?? 0) * multiplier,
      y: (widget.y ?? 0) * multiplier,
      w: (widget.colSpan ?? 4) * multiplier, 
      h: (widget.rowSpan ?? 4) * multiplier,
    };
  });

  return {
    lg: lgLayout,
    sm: generateMobileLayout(lgLayout, GRID_COLS.sm),
  };
}

/**
 * Helper to generate a simple mobile layout (stacking or simple grid)
 * This acts as a naive "reflow" for mobile if no specific mobile config exists.
 */
function generateMobileLayout(baseLayout: Layout[], columns: number): Layout[] {
  return baseLayout.map((l, index) => {
    // For mobile (5 cols), we generally want full width widgets.
    
    return {
      ...l,
      x: 0,
      y: index * l.h, // Simple stack
      w: columns,     // Full width
      h: l.h
    };
  });
}

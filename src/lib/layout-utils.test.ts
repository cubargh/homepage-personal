import { describe, it, expect } from "vitest";
import { generateLayouts } from "./layout-utils";
import { DashboardConfig } from "@/types";

describe("generateLayouts", () => {
  it("should generate layout with normal config x, y, w, h values", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 0,
          y: 0,
          colSpan: 4,
          rowSpan: 4,
        },
        {
          id: "widget2",
          type: "clock",
          x: 4,
          y: 0,
          colSpan: 2,
          rowSpan: 2,
        },
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg).toHaveLength(2);
    expect(layouts.lg[0]).toEqual({
      i: "widget1",
      x: 0, // 0 * 2
      y: 0, // 0 * 2
      w: 8, // 4 * 2
      h: 8, // 4 * 2
    });
    expect(layouts.lg[1]).toEqual({
      i: "widget2",
      x: 8, // 4 * 2
      y: 0, // 0 * 2
      w: 4, // 2 * 2
      h: 4, // 2 * 2
    });
  });

  it("should use default sizes when useDefaultSize is true", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 0,
          y: 0,
          colSpan: 4,
          rowSpan: 4,
        },
        {
          id: "widget2",
          type: "clock",
          x: 4,
          y: 0,
          colSpan: 2,
          rowSpan: 2,
        },
      ],
    };

    const layouts = generateLayouts(config, true);
    
    expect(layouts.lg).toHaveLength(2);
    expect(layouts.lg[0]).toEqual({
      i: "widget1",
      x: 0, // (0 % 10) * 2
      y: 0, // Math.floor(0 / 10) * 2
      w: 2,
      h: 2,
    });
    expect(layouts.lg[1]).toEqual({
      i: "widget2",
      x: 2, // (1 % 10) * 2
      y: 0, // Math.floor(1 / 10) * 2
      w: 2,
      h: 2,
    });
  });

  it("should use default x/y values when missing", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          colSpan: 4,
          rowSpan: 4,
        } as any,
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg[0]).toEqual({
      i: "widget1",
      x: 0, // undefined ?? 0 * 2
      y: 0, // undefined ?? 0 * 2
      w: 8, // 4 * 2
      h: 8, // 4 * 2
    });
  });

  it("should use default colSpan/rowSpan values when missing", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 2,
          y: 2,
        } as any,
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg[0]).toEqual({
      i: "widget1",
      x: 4, // 2 * 2
      y: 4, // 2 * 2
      w: 8, // undefined ?? 4 * 2
      h: 8, // undefined ?? 4 * 2
    });
  });

  it("should handle multiple widgets", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 0,
          y: 0,
          colSpan: 4,
          rowSpan: 4,
        },
        {
          id: "widget2",
          type: "clock",
          x: 4,
          y: 0,
          colSpan: 2,
          rowSpan: 2,
        },
        {
          id: "widget3",
          type: "calendar",
          x: 0,
          y: 4,
          colSpan: 6,
          rowSpan: 4,
        },
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg).toHaveLength(3);
    expect(layouts.lg[0].i).toBe("widget1");
    expect(layouts.lg[1].i).toBe("widget2");
    expect(layouts.lg[2].i).toBe("widget3");
  });

  it("should verify multiplier (2x) is applied correctly", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 1,
          y: 2,
          colSpan: 3,
          rowSpan: 5,
        },
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg[0]).toEqual({
      i: "widget1",
      x: 2, // 1 * 2
      y: 4, // 2 * 2
      w: 6, // 3 * 2
      h: 10, // 5 * 2
    });
  });

  it("should generate mobile layout (sm breakpoint)", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [
        {
          id: "widget1",
          type: "weather",
          x: 0,
          y: 0,
          colSpan: 4,
          rowSpan: 4,
        },
        {
          id: "widget2",
          type: "clock",
          x: 4,
          y: 0,
          colSpan: 2,
          rowSpan: 2,
        },
      ],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.sm).toBeDefined();
    expect(layouts.sm).toHaveLength(2);
    
    // Mobile layout should stack widgets vertically
    expect(layouts.sm[0]).toEqual({
      i: "widget1",
      x: 0,
      y: 0, // index * h
      w: 5, // GRID_COLS.sm
      h: layouts.lg[0].h, // Same height as lg
    });
    
    expect(layouts.sm[1]).toEqual({
      i: "widget2",
      x: 0,
      y: 1 * layouts.lg[1].h, // index * h = 1 * 4 = 4
      w: 5, // GRID_COLS.sm
      h: layouts.lg[1].h, // Same height as lg
    });
  });

  it("should handle empty widgets array", () => {
    const config: DashboardConfig = {
      timezone: "UTC",
      widgets: [],
    };

    const layouts = generateLayouts(config);
    
    expect(layouts.lg).toEqual([]);
    expect(layouts.sm).toEqual([]);
  });
});


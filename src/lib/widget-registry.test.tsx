import { describe, it, expect, beforeEach } from "vitest";
import { WidgetRegistry } from "./widget-registry";
import { WidgetType } from "@/types";
import React from "react";

// Mock React component
const MockWidget = () => <div>Mock Widget</div>;

describe("WidgetRegistry", () => {
  beforeEach(() => {
    // Clear registry before each test
    const allWidgets = WidgetRegistry.getAll();
    allWidgets.forEach((widget) => {
      // Note: There's no unregister method, so we'll work with what we have
      // In a real scenario, you might want to add an unregister method
    });
  });

  it("should register widget definition", () => {
    const definition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 4, h: 4 },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("weather");

    expect(retrieved).toBeDefined();
    expect(retrieved?.type).toBe("weather");
    expect(retrieved?.component).toBe(MockWidget);
  });

  it("should retrieve widget by type", () => {
    const definition = {
      type: "clock" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 2, h: 2 },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("clock");

    expect(retrieved).toEqual(definition);
  });

  it("should return undefined for unregistered type", () => {
    const retrieved = WidgetRegistry.get("nonexistent" as WidgetType);
    expect(retrieved).toBeUndefined();
  });

  it("should return all registered widgets", () => {
    const widget1 = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 4, h: 4 },
    };

    const widget2 = {
      type: "clock" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 2, h: 2 },
    };

    WidgetRegistry.register(widget1);
    WidgetRegistry.register(widget2);

    const allWidgets = WidgetRegistry.getAll();

    expect(allWidgets.length).toBeGreaterThanOrEqual(2);
    expect(allWidgets).toContainEqual(widget1);
    expect(allWidgets).toContainEqual(widget2);
  });

  it("should overwrite existing registrations", () => {
    const originalDefinition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 4, h: 4 },
    };

    const newDefinition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => false,
      getProps: () => ({ custom: "props" }),
      grid: { w: 6, h: 6 },
    };

    WidgetRegistry.register(originalDefinition);
    WidgetRegistry.register(newDefinition);

    const retrieved = WidgetRegistry.get("weather");

    expect(retrieved).toEqual(newDefinition);
    expect(retrieved).not.toEqual(originalDefinition);
  });

  it("should handle different widget types", () => {
    const types: WidgetType[] = [
      "weather",
      "clock",
      "calendar",
      "service-monitor",
      "shortcuts",
    ];

    types.forEach((type) => {
      const definition = {
        type,
        component: MockWidget,
        isEnabled: () => true,
        getProps: () => ({}),
        grid: { w: 2, h: 2 },
      };

      WidgetRegistry.register(definition);
      const retrieved = WidgetRegistry.get(type);

      expect(retrieved?.type).toBe(type);
    });
  });

  it("should handle isEnabled function", () => {
    const mockConfig = {
      widgets: {
        weather: { enabled: true },
      },
    } as any;

    const definition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: (config: any) => config.widgets.weather.enabled,
      getProps: () => ({}),
      grid: { w: 4, h: 4 },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("weather");

    expect(retrieved?.isEnabled(mockConfig)).toBe(true);
  });

  it("should handle getProps function", () => {
    const mockConfig = {
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
        },
      },
    } as any;

    const definition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: (config: any) => ({
        config: config.widgets.weather,
      }),
      grid: { w: 4, h: 4 },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("weather");

    const props = retrieved?.getProps(mockConfig);
    expect(props).toEqual({
      config: {
        enabled: true,
        lat: 40.7128,
        lon: -74.006,
      },
    });
  });

  it("should handle grid configuration", () => {
    const definition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: {
        w: 4,
        h: 4,
        minW: 2,
        minH: 2,
      },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("weather");

    expect(retrieved?.grid.w).toBe(4);
    expect(retrieved?.grid.h).toBe(4);
    expect(retrieved?.grid.minW).toBe(2);
    expect(retrieved?.grid.minH).toBe(2);
  });

  it("should handle options configuration", () => {
    const definition = {
      type: "weather" as WidgetType,
      component: MockWidget,
      isEnabled: () => true,
      getProps: () => ({}),
      grid: { w: 4, h: 4 },
      options: {
        defaultX: 0,
        defaultY: 0,
        defaultId: "weather-widget",
      },
    };

    WidgetRegistry.register(definition);
    const retrieved = WidgetRegistry.get("weather");

    expect(retrieved?.options?.defaultX).toBe(0);
    expect(retrieved?.options?.defaultY).toBe(0);
    expect(retrieved?.options?.defaultId).toBe("weather-widget");
  });
});


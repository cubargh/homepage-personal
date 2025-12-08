import { describe, it, expect } from "vitest";
import {
  normalizeWidgetConfig,
  getFirstEnabledWidgetConfig,
} from "./widget-config-utils";

interface TestConfig {
  enabled: boolean;
  value: string;
}

describe("normalizeWidgetConfig", () => {
  it("should return empty array for undefined input", () => {
    expect(normalizeWidgetConfig(undefined)).toEqual([]);
  });

  it("should return array for single object input", () => {
    const config: TestConfig = { enabled: true, value: "test" };
    expect(normalizeWidgetConfig(config)).toEqual([config]);
  });

  it("should return array as-is for array input", () => {
    const configs: TestConfig[] = [
      { enabled: true, value: "test1" },
      { enabled: false, value: "test2" },
    ];
    expect(normalizeWidgetConfig(configs)).toEqual(configs);
  });

  it("should return empty array for empty array input", () => {
    expect(normalizeWidgetConfig([])).toEqual([]);
  });

  it("should handle null input", () => {
    expect(normalizeWidgetConfig(null as any)).toEqual([]);
  });
});

describe("getFirstEnabledWidgetConfig", () => {
  it("should return single enabled config", () => {
    const config: TestConfig = { enabled: true, value: "test" };
    expect(getFirstEnabledWidgetConfig(config)).toEqual(config);
  });

  it("should return first enabled config from multiple configs", () => {
    const configs: TestConfig[] = [
      { enabled: false, value: "disabled1" },
      { enabled: true, value: "enabled1" },
      { enabled: true, value: "enabled2" },
    ];
    expect(getFirstEnabledWidgetConfig(configs)).toEqual(configs[1]);
  });

  it("should return undefined when all configs are disabled", () => {
    const configs: TestConfig[] = [
      { enabled: false, value: "disabled1" },
      { enabled: false, value: "disabled2" },
    ];
    expect(getFirstEnabledWidgetConfig(configs)).toBeUndefined();
  });

  it("should return undefined for single disabled config", () => {
    const config: TestConfig = { enabled: false, value: "test" };
    expect(getFirstEnabledWidgetConfig(config)).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(getFirstEnabledWidgetConfig(undefined)).toBeUndefined();
  });

  it("should return undefined for empty array", () => {
    expect(getFirstEnabledWidgetConfig([])).toBeUndefined();
  });

  it("should handle mixed enabled/disabled array", () => {
    const configs: TestConfig[] = [
      { enabled: false, value: "disabled" },
      { enabled: true, value: "enabled" },
      { enabled: false, value: "disabled2" },
    ];
    expect(getFirstEnabledWidgetConfig(configs)).toEqual(configs[1]);
  });

  it("should return first enabled config even if later ones are also enabled", () => {
    const configs: TestConfig[] = [
      { enabled: true, value: "first" },
      { enabled: true, value: "second" },
    ];
    expect(getFirstEnabledWidgetConfig(configs)).toEqual(configs[0]);
  });
});


import { describe, it, expect } from "vitest";
import { validateConfig } from "./config-validation";

describe("validateConfig", () => {
  it("should validate valid config", () => {
    const validConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          enabled: true,
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "test-key",
          units: "metric",
        },
        sports: {
          enabled: true,
        },
        calendar: {
          enabled: true,
          ics_urls: ["https://example.com/calendar.ics"],
        },
        service_status: {
          enabled: true,
          columns: 3,
          services: [
            {
              name: "Service 1",
              url: "https://service1.com",
            },
          ],
        },
      },
    };

    const result = validateConfig(validConfig);
    expect(result).toBeDefined();
    expect(result.server.root_domain).toBe("example.com");
  });

  it("should throw error for missing required fields", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        // Missing timezone
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {},
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it("should throw error for invalid field types", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          enabled: "not-a-boolean", // Should be boolean
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {},
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it("should throw error for invalid enum values", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        service_status: {
          enabled: true,
          columns: 3,
          click_behavior: "invalid-value", // Should be "new_tab" or "same_tab"
          services: [
            {
              name: "Service 1",
              url: "https://service1.com",
            },
          ],
        },
      },
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it("should validate nested object validation", () => {
    const validConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          enabled: true,
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "test-key",
          units: "metric",
        },
        sports: {
          enabled: true,
          f1: {
            enabled: true,
          },
          football: {
            enabled: true,
            api_key: "football-key",
          },
        },
        calendar: {
          enabled: true,
          ics_urls: [],
        },
        service_status: {
          enabled: true,
          columns: 3,
          services: [],
        },
      },
    };

    const result = validateConfig(validConfig);
    expect(result.widgets.sports).toBeDefined();
  });

  it("should validate array validation", () => {
    const validConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "test-key",
          units: "metric",
        },
        sports: {
          enabled: true,
        },
        calendar: {
          enabled: true,
          ics_urls: [
            "https://example.com/calendar1.ics",
            "https://example.com/calendar2.ics",
          ],
        },
        service_status: {
          enabled: true,
          columns: 3,
          services: [
            {
              name: "Service 1",
              url: "https://service1.com",
            },
            {
              name: "Service 2",
              url: "https://service2.com",
              icon: "service-icon",
            },
          ],
        },
      },
    };

    const result = validateConfig(validConfig);
    const calendarConfig = Array.isArray(result.widgets.calendar) 
      ? result.widgets.calendar[0] 
      : result.widgets.calendar;
    const serviceStatusConfig = Array.isArray(result.widgets.service_status)
      ? result.widgets.service_status[0]
      : result.widgets.service_status;
    expect(calendarConfig.ics_urls).toHaveLength(2);
    expect(serviceStatusConfig.services).toHaveLength(2);
  });

  it("should format error messages correctly", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        timezone: 123, // Should be string
        auth: {
          passphrase: "secret",
          session_days: "not-a-number", // Should be number
        },
      },
      widgets: {},
    };

    try {
      validateConfig(invalidConfig);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toContain("Config validation failed");
        expect(error.message).toContain("server.timezone");
      }
    }
  });

  it("should handle optional fields", () => {
    const configWithOptionals = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        debug: true,
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      page: {
        title: "My Homepage",
        favicon: "/favicon.ico",
      },
      spotlight: {
        search_providers: [
          {
            name: "Google",
            url: "https://google.com/search?q=",
          },
        ],
        fuzzy_search: true,
      },
      theme: {
        grid_background: "#000000",
        card_background: "#ffffff",
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "test-key",
          units: "metric",
        },
        sports: {
          enabled: true,
        },
        calendar: {
          enabled: true,
          ics_urls: [],
        },
        service_status: {
          enabled: true,
          columns: "auto",
          services: [],
        },
      },
    };

    const result = validateConfig(configWithOptionals);
    expect(result.server.debug).toBe(true);
    expect(result.page?.title).toBe("My Homepage");
    expect(result.spotlight?.fuzzy_search).toBe(true);
  });

  it("should handle widget configs as arrays", () => {
    const configWithArray = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: [
          {
            enabled: true,
            lat: 40.7128,
            lon: -74.006,
            api_key: "test-key",
            units: "metric",
          },
          {
            enabled: false,
            lat: 51.5074,
            lon: -0.1278,
            api_key: "test-key-2",
            units: "imperial",
          },
        ],
        sports: {
          enabled: true,
        },
        calendar: {
          enabled: true,
          ics_urls: [],
        },
        service_status: {
          enabled: true,
          columns: 3,
          services: [],
        },
      },
    };

    const result = validateConfig(configWithArray);
    expect(Array.isArray(result.widgets.weather)).toBe(true);
    expect(result.widgets.weather).toHaveLength(2);
  });

  it("should allow passthrough for unknown widget configs", () => {
    const configWithUnknownWidget = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "test-key",
          units: "metric",
        },
        sports: {
          enabled: true,
        },
        calendar: {
          enabled: true,
          ics_urls: [],
        },
        service_status: {
          enabled: true,
          columns: 3,
          services: [],
        },
        unknown_widget: {
          // This should pass through due to passthrough()
          some_field: "value",
        },
      },
    };

    const result = validateConfig(configWithUnknownWidget);
    expect((result.widgets as any).unknown_widget).toBeDefined();
  });

  it("should validate URL format in service_status", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        service_status: {
          enabled: true,
          columns: 3,
          services: [
            {
              name: "Service 1",
              url: "not-a-valid-url", // Should be valid URL
            },
          ],
        },
      },
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  it("should validate minimum string length", () => {
    const invalidConfig = {
      server: {
        root_domain: "example.com",
        timezone: "UTC",
        auth: {
          passphrase: "secret",
          session_days: 7,
        },
      },
      widgets: {
        weather: {
          enabled: true,
          lat: 40.7128,
          lon: -74.006,
          api_key: "", // Should have min length of 1
          units: "metric",
        },
      },
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});


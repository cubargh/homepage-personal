/**
 * Centralized default values for widget configurations
 *
 * These constants help ensure consistency across widgets and make it easy
 * to adjust timing or other defaults in one place.
 */

/**
 * Refresh intervals in milliseconds
 *
 * Use these constants instead of hardcoding refresh intervals in widget definitions.
 *
 * @example
 * ```ts
 * defineWidget({
 *   // ...
 *   getProps: (cfg) => ({
 *     config: {
 *       refreshInterval: REFRESH_INTERVALS.SLOW,
 *     },
 *   }),
 * });
 * ```
 */
export const REFRESH_INTERVALS = {
  /** 1 second - For real-time data (qBittorrent speeds, IP camera frames) */
  REAL_TIME: 1000,

  /** 30 seconds - For frequently changing data (Navidrome now playing) */
  FAST: 30 * 1000,

  /** 1 minute - For moderately changing data (service status, sports scores) */
  STANDARD: 60 * 1000,

  /** 5 minutes - For slower changing data (Jellyfin, Ghostfolio, Speedtest, RSS) */
  SLOW: 5 * 60 * 1000,

  /** 15 minutes - For calendar events */
  CALENDAR: 15 * 60 * 1000,

  /** 30 minutes - For weather data */
  WEATHER: 30 * 60 * 1000,

  /** 1 hour - For rarely changing data (F1 schedule) */
  HOURLY: 60 * 60 * 1000,
} as const;

/**
 * Type for refresh interval keys
 */
export type RefreshIntervalKey = keyof typeof REFRESH_INTERVALS;

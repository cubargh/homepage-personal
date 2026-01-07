"use client";

import useSWR, { SWRConfiguration } from "swr";
import { useCallback, useState } from "react";

interface UseWidgetDataOptions {
  /** API endpoint to fetch data from */
  endpoint: string;
  /** Refresh interval in milliseconds */
  refreshInterval: number;
  /** Whether to enable fetching (defaults to true) */
  enabled?: boolean;
  /** Additional SWR configuration options */
  swrOptions?: SWRConfiguration;
}

interface UseWidgetDataResult<T> {
  /** The fetched data */
  data: T | undefined;
  /** Error if the fetch failed */
  error: Error | undefined;
  /** True during initial load (no data yet) */
  isLoading: boolean;
  /** True when manually refreshing */
  isRefreshing: boolean;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

/**
 * Shared fetcher function for widget data
 */
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch data from ${url}`);
  }
  return res.json();
}

/**
 * Custom hook for fetching widget data with SWR
 *
 * Consolidates the identical fetcher + SWR pattern used across 13+ widgets.
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = useWidgetData<ImmichStats>({
 *   endpoint: "/api/immich",
 *   refreshInterval: 60000 * 15,
 * });
 * ```
 */
export function useWidgetData<T>(options: UseWidgetDataOptions): UseWidgetDataResult<T> {
  const { endpoint, refreshInterval, enabled = true, swrOptions } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled ? endpoint : null,
    fetcher<T>,
    {
      refreshInterval,
      ...swrOptions,
    }
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}

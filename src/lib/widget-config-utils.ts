// Utility functions for handling widget configs (both single objects and arrays)
// This file is safe to import in client components as it doesn't use Node.js modules

// Helper to normalize widget config to array
export function normalizeWidgetConfig<T>(config: T | T[] | undefined): T[] {
  if (!config) return [];
  return Array.isArray(config) ? config : [config];
}

// Helper to get first enabled widget config (for widgets that don't aggregate)
export function getFirstEnabledWidgetConfig<T extends { enabled: boolean }>(
  config: T | T[] | undefined
): T | undefined {
  const configs = normalizeWidgetConfig(config);
  return configs.find((c) => c.enabled);
}







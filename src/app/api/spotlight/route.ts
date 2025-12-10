import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";
import { cached } from "@/lib/cache";

// Cache API response for 5 minutes
export const revalidate = 300;

export const GET = withErrorHandling(async () => {
  // Cache the config loading since it's expensive and doesn't change often
  const result = await cached(
    "spotlight:config",
    async () => {
      const config = loadConfig();

      // Get shortcuts
      const shortcutsConfig = getFirstEnabledWidgetConfig(config.widgets.shortcuts);
      const shortcuts = shortcutsConfig?.shortcuts || [];

      // Get services
      const servicesConfig = getFirstEnabledWidgetConfig(
        config.widgets.service_status
      );
      const services = servicesConfig?.services || [];

      // Get spotlight config
      const spotlightConfig = config.spotlight || {
        search_engine: "google",
      };

      return {
        shortcuts,
        services,
        spotlight: spotlightConfig,
      };
    },
    300000 // 5 minutes
  );

  const response = NextResponse.json(result);
  // Add cache headers for browser caching
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
});

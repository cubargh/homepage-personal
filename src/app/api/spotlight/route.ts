import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async () => {
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

  return NextResponse.json({
    shortcuts,
    services,
    spotlight: spotlightConfig,
  });
});

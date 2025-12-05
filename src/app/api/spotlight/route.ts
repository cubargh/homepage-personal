import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

export async function GET() {
  try {
    const config = loadConfig();

    // Get shortcuts
    const shortcutsConfig = getFirstEnabledWidgetConfig(config.widgets.shortcuts);
    const shortcuts = shortcutsConfig?.shortcuts || [];

    // Get services
    const servicesConfig = getFirstEnabledWidgetConfig(config.widgets.service_status);
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
  } catch (error) {
    console.error("Failed to load spotlight data:", error);
    return NextResponse.json(
      { error: "Failed to load spotlight data" },
      { status: 500 }
    );
  }
}




import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { getDashboardConfig } from "@/config/dashboard";
import { WidgetConfig } from "@/types";

// Force dynamic rendering to ensure environment variables are read at runtime in Docker
export const dynamic = 'force-dynamic';

// This is a Server Component by default
export default function Home() {
  // Fetch config at request time on the server
  const dashboardConfig = getDashboardConfig();

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 lg:h-screen lg:overflow-hidden flex flex-col">
      {/* 
         3-column grid layout optimized for 1080p screens.
         Col 1: Weather (Top) + Services (Bottom)
         Col 2: F1 (Full Height)
         Col 3: Football (Full Height)
      */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[300px_1fr] flex-1 min-h-0">
        {dashboardConfig.widgets.map((widget: WidgetConfig) => {
          let Component: any; // Explicitly type as any to avoid complex TS union mismatches in map
          let props = {};

          switch (widget.type) {
            case "service-monitor":
              Component = ServiceWidget;
              props = { services: dashboardConfig.services, config: dashboardConfig.monitoring };
              break;
            case "f1":
              Component = F1Widget;
              props = { config: { ...dashboardConfig.f1, timezone: dashboardConfig.timezone } };
              break;
            case "football":
              Component = FootballWidget;
              props = { config: { ...dashboardConfig.football, timezone: dashboardConfig.timezone } };
              break;
            case "weather":
              Component = WeatherWidget;
              props = { config: { ...dashboardConfig.weather, timezone: dashboardConfig.timezone } };
              break;
            default:
              return null;
          }

          // Column Span logic (Default to 1)
          let colClass = "lg:col-span-1";
          if (widget.colSpan) {
             if (widget.colSpan === 2) colClass = "lg:col-span-2";
             else if (widget.colSpan === 3) colClass = "lg:col-span-3";
          }

          // Row Span logic
          let rowClass = "lg:row-span-1";
          if (widget.rowSpan) {
             if (widget.rowSpan === 2) rowClass = "lg:row-span-2";
          }

          // Specific positioning override based on ID to ensure correct layout
          let positionClass = "";
          if (widget.id === "weather") positionClass = "lg:col-start-1 lg:row-start-1";
          if (widget.id === "services") positionClass = "lg:col-start-1 lg:row-start-2";
          if (widget.id === "f1-next-race") positionClass = "lg:col-start-2 lg:row-start-1 lg:row-span-2";
          if (widget.id === "football-matches") positionClass = "lg:col-start-3 lg:row-start-1 lg:row-span-2";

          // Apply height classes: h-full to fill the grid cell on desktop
          // On mobile, enforce min-h-[33vh] for non-weather widgets
          let heightClass = "h-full";
          if (widget.type !== 'weather') {
             heightClass += " min-h-[33vh] lg:min-h-0";
          }

          return (
            <div key={widget.id} className={`${colClass} ${rowClass} ${positionClass} ${heightClass} min-h-0`}>
              <Component {...props} />
            </div>
          );
        })}
      </div>
    </main>
  );
}

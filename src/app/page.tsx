import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { SportsWidget } from "@/components/dashboard/sports-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { getDashboardConfig } from "@/config/dashboard";
import { WidgetConfig } from "@/types";
import { cn } from "@/lib/utils";

// Map widget types to their components
const WIDGET_COMPONENTS = {
  "service-monitor": ServiceWidget,
  "f1": F1Widget,
  "football": FootballWidget,
  "weather": WeatherWidget,
  "sports": SportsWidget,
  "calendar": CalendarWidget,
} as const;

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
         Col 2: Calendar (Full Height)
         Col 3: Sports (Full Height)
      */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[300px_1fr] flex-1 min-h-0 content-start">
        {dashboardConfig.widgets.map((widget: WidgetConfig) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type as keyof typeof WIDGET_COMPONENTS];
          
          if (!WidgetComponent) return null;

          // Resolve props based on widget type
          let props = {};
          if (widget.type === "service-monitor") {
            props = { services: dashboardConfig.services, config: dashboardConfig.monitoring };
          } else if (widget.type === "sports") {
            props = { 
               f1Config: { ...dashboardConfig.f1, timezone: dashboardConfig.timezone },
               footballConfig: { ...dashboardConfig.football, timezone: dashboardConfig.timezone }
             };
          } else if (widget.type === "weather") {
            props = { config: { ...dashboardConfig.weather, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "calendar") {
            props = { config: { ...dashboardConfig.calendar, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "f1") {
            props = { config: { ...dashboardConfig.f1, timezone: dashboardConfig.timezone } };
          } else if (widget.type === "football") {
            props = { config: { ...dashboardConfig.football, timezone: dashboardConfig.timezone } };
          }

          // Grid positioning classes
          const gridClasses = cn(
            "h-full min-h-0", // Default
            widget.colSpan === 2 && "lg:col-span-2",
            widget.colSpan === 3 && "lg:col-span-3",
            widget.rowSpan === 2 && "lg:row-span-2",
            // Specific positioning can be moved to config or kept here if exceptional
            widget.id === "weather" && "lg:col-start-1 lg:row-start-1",
            widget.id === "services" && "lg:col-start-1 lg:row-start-2",
            widget.id === "calendar" && "lg:col-start-2 lg:row-start-1",
            widget.id === "sports-combined" && "lg:col-start-3 lg:row-start-1"
          );

          return (
            <div key={widget.id} className={gridClasses}>
              <WidgetComponent {...props as any} />
            </div>
          );
        })}
      </div>
    </main>
  );
}

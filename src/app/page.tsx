import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { dashboardConfig } from "@/config/dashboard";
import { WidgetConfig } from "@/types";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Neolab</h1>
      </header>
      
      {/* 
         We use a 6-column grid to allow for flexible layouts:
         - 33% = 2 cols
         - 66% = 4 cols
         - 50% = 3 cols
         - 100% = 6 cols
      */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-6 auto-rows-[400px]">
        {dashboardConfig.widgets.map((widget: WidgetConfig) => {
          let Component;
          switch (widget.type) {
            case "service-monitor":
              Component = ServiceWidget;
              break;
            case "f1":
              Component = F1Widget;
              break;
            case "football":
              Component = FootballWidget;
              break;
            case "weather":
              Component = WeatherWidget;
              break;
            default:
              return null;
          }

          // Map colSpan (based on 6-col grid) to Tailwind classes
          let colSpanClass = "md:col-span-1";
          if (widget.colSpan) {
            switch (widget.colSpan) {
                case 1: colSpanClass = "md:col-span-1"; break;
                case 2: colSpanClass = "md:col-span-2"; break;
                case 3: colSpanClass = "md:col-span-3"; break;
                case 4: colSpanClass = "md:col-span-4"; break;
                case 5: colSpanClass = "md:col-span-5"; break;
                case 6: colSpanClass = "md:col-span-6"; break;
                default: colSpanClass = `md:col-span-${widget.colSpan}`;
            }
          }

          return (
            <div key={widget.id} className={`${colSpanClass} row-span-1`}>
              <Component />
            </div>
          );
        })}
      </div>
    </main>
  );
}

import { ServiceWidget } from "@/components/dashboard/service-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { dashboardConfig } from "@/config/dashboard";
import { WidgetConfig } from "@/types";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Personal Dashboard</h1>
      </header>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 auto-rows-[400px]">
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
            default:
              return null;
          }

          const colSpanClass = widget.colSpan === 2 ? "md:col-span-2" : "md:col-span-1";

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

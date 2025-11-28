import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetConfig } from "@/types";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  visibleWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  showDebug: boolean;
  onToggleDebug: () => void;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  widgets,
  visibleWidgetIds,
  onToggleWidget,
  showDebug,
  onToggleDebug,
}: SettingsSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out p-6 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Dashboard Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-8">
          {/* Widgets Section */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Widgets
            </h3>
            <div className="space-y-3">
              {widgets.map((widget) => {
                const isVisible = visibleWidgetIds.includes(widget.id);
                // Try to get a friendly name from type or id if not available, 
                // but usually id is descriptive enough or we map types.
                // For now using ID/Type as label.
                const label = widget.id.charAt(0).toUpperCase() + widget.id.slice(1).replace(/-/g, ' ');
                
                return (
                  <div key={widget.id} className="flex items-center justify-between">
                    <label
                      htmlFor={`widget-${widget.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                    <input
                      type="checkbox"
                      id={`widget-${widget.id}`}
                      checked={isVisible}
                      onChange={() => onToggleWidget(widget.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-border" />

          {/* Debug Section */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              System
            </h3>
            <div className="flex items-center justify-between">
              <label
                htmlFor="debug-toggle"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Debug Overlay
              </label>
              <input
                type="checkbox"
                id="debug-toggle"
                checked={showDebug}
                onChange={onToggleDebug}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}


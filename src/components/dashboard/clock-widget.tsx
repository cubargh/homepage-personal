"use client";

import { useState, useEffect } from "react";
import { ClockWidgetProps } from "@/types";
import { Clock } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { formatTime } from "@/lib/utils";

export function ClockWidget({ config, gridSize }: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Determine layout modes based on gridSize
  const isCompact = gridSize ? gridSize.h <= 2 : false;
  const isMinimal = gridSize ? (gridSize.w === 1 && gridSize.h === 1) : false;

  // Configuration defaults
  const format = config.format || "24h";
  const showSeconds = config.showSeconds !== false; // Default to true
  const showDate = config.showDate !== false; // Default to true
  const showDay = config.showDay !== false; // Default to true

  useEffect(() => {
    // Update time every second if showing seconds, otherwise every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, showSeconds ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [showSeconds]);

  // Format time based on configuration
  const getTimeFormat = () => {
    if (format === "12h") {
      return showSeconds ? "h:mm:ss a" : "h:mm a";
    } else {
      return showSeconds ? "HH:mm:ss" : "HH:mm";
    }
  };

  const timeFormat = getTimeFormat();
  const timeString = formatTime(currentTime, timeFormat, config.timezone);
  const dateString = formatTime(currentTime, "EEEE, MMMM d, yyyy", config.timezone);
  const shortDateString = formatTime(currentTime, "MMM d, yyyy", config.timezone);
  const dayString = formatTime(currentTime, "EEEE", config.timezone);

  if (isMinimal) {
    // 1x1 Minimal Layout: Just time
    return (
      <WidgetLayout
        gridSize={gridSize}
        title={undefined}
        icon={undefined}
        contentClassName="p-0"
      >
        <div className="h-full flex flex-col items-center justify-center p-2">
          <div className="text-2xl font-bold tabular-nums">{timeString}</div>
        </div>
      </WidgetLayout>
    );
  }

  if (isCompact) {
    // Compact Layout: Time + optional date
    return (
      <WidgetLayout
        gridSize={gridSize}
        title="Clock"
        icon={<Clock className="h-5 w-5" />}
        contentClassName="p-0"
      >
        <div className="h-full flex flex-col items-center justify-center p-4 gap-2">
          <div className="text-4xl font-bold tabular-nums">{timeString}</div>
          {showDate && (
            <div className="text-sm text-muted-foreground">{shortDateString}</div>
          )}
        </div>
      </WidgetLayout>
    );
  }

  // Standard Layout: Full clock with optional date and day
  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Clock"
      icon={<Clock className="h-5 w-5" />}
      contentClassName="p-0"
    >
      <div className="h-full flex flex-col items-center justify-center p-6 gap-3">
        <div className="text-6xl font-bold tabular-nums">{timeString}</div>
        {showDay && (
          <div className="text-lg text-muted-foreground text-center">
            {dayString}
          </div>
        )}
        {showDate && (
          <div className="text-sm text-muted-foreground text-center">
            {dateString}
          </div>
        )}
      </div>
    </WidgetLayout>
  );
}


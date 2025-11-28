import React from "react";
import { DashboardConfig } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { GRID_COLS, GRID_MARGIN } from "@/config/grid";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface GridSkeletonProps {
  config: DashboardConfig;
}

// Ensure this matches DashboardGrid's CONTAINER_PADDING
const SKELETON_PADDING = "10px";

export const GridSkeleton = ({ config }: GridSkeletonProps) => {
  // Use CSS Grid to approximate the layout
  // We use GRID_COLS.lg (20) as the default server-side view
  
  const multiplier = 2;

  return (
    <div 
      className="grid gap-[10px] w-full"
      style={{
        padding: SKELETON_PADDING,
        gridTemplateColumns: `repeat(${GRID_COLS.lg}, minmax(0, 1fr))`,
        gridAutoRows: "minmax(50px, auto)"
      }}
    >
      {config.widgets.map((widget) => {
        const colSpan = (widget.colSpan ?? 3) * multiplier;
        const rowSpan = (widget.rowSpan ?? 2) * multiplier;
        const x = (widget.x ?? 0) * multiplier;
        const y = (widget.y ?? 0) * multiplier;

        const style: React.CSSProperties = {
          gridColumn: `span ${colSpan}`,
          gridRow: `span ${rowSpan}`,
          height: rowSpan * 50 + (rowSpan - 1) * GRID_MARGIN[1] 
        };

        if (widget.x !== undefined && widget.y !== undefined) {
           style.gridColumnStart = x + 1;
           style.gridRowStart = y + 1;
        }

        return (
          <Card
            key={widget.id}
            className="flex flex-col overflow-hidden border-border/50 shadow-sm bg-card/50"
            style={style}
          >
            <CardHeader className="p-3 pb-2 space-y-0 border-b border-border/10">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-4 w-4 rounded-full" />
                     <Skeleton className="h-3 w-24" />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="flex-1 p-3 space-y-2">
               <Skeleton className="h-full w-full rounded-md opacity-50" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

import React from "react";
import { DashboardConfig } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { GRID_MARGIN, TARGET_CELL_WIDTH } from "@/config/grid";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface GridSkeletonProps {
  config: DashboardConfig;
}

// Ensure this matches DashboardGrid's CONTAINER_PADDING
const SKELETON_PADDING = "10px";

export const GridSkeleton = ({ config }: GridSkeletonProps) => {
  // Use CSS Grid's auto-fill to approximate the dynamic column behavior
  // This avoids needing JS width calculation for the skeleton
  
  const multiplier = 2;

  return (
    <div 
      className="grid gap-[10px] w-full"
      style={{
        padding: SKELETON_PADDING,
        // Match the dynamic logic: fill with ~60px columns
        gridTemplateColumns: `repeat(auto-fill, minmax(${TARGET_CELL_WIDTH}px, 1fr))`,
        gridAutoRows: "minmax(50px, auto)"
      }}
    >
      {config.widgets.map((widget) => {
        // We can't perfectly position items without knowing the exact column count,
        // but we can preserve their relative sizes.
        const colSpan = (widget.colSpan ?? 3) * multiplier;
        const rowSpan = (widget.rowSpan ?? 2) * multiplier;
        
        // For the skeleton, we just let them flow naturally or try to respect span
        const style: React.CSSProperties = {
          gridColumn: `span ${colSpan}`,
          gridRow: `span ${rowSpan}`,
          height: rowSpan * 50 + (rowSpan - 1) * GRID_MARGIN[1] 
        };

        // Note: Specific x/y positioning in CSS grid requires explicit line numbers
        // which we can't easily generate without knowing the total columns.
        // So we omit x/y for the skeleton to avoid items flying off-screen.
        // They will stack nicely instead.

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

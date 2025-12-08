"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GridSize } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WidgetLayoutProps {
  gridSize?: GridSize;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WidgetLayout({
  gridSize,
  title,
  icon,
  headerActions,
  children,
  className,
  contentClassName,
}: WidgetLayoutProps) {
  // Determine layout modes:
  // - Minimal: 1x1 (if supported by widget)
  // - Compact: 2x2 (standard compact size)
  // - Standard: 3x3+ (full layout)
  const isMinimal = gridSize ? (gridSize.w === 1 && gridSize.h === 1) : false;
  const isCompact = gridSize ? (gridSize.w === 2 && gridSize.h === 2) : false;
  
  // Show header if height >= 2 (hide for 1x1 minimal widgets)
  const showHeader = title && !isMinimal;

  // Standard padding tokens
  // - Minimal (1x1): p-2
  // - Compact (2x2): p-3
  // - Standard (3x3+): p-4
  const paddingClass = isMinimal ? "p-2" : isCompact ? "p-3" : "p-4";

  return (
    <Card className={cn("h-full w-full flex flex-col overflow-hidden border-border/50 transition-all", className)}>
      {showHeader && (
        <CardHeader className="bg-secondary/10 py-3 px-4 h-[50px] shrink-0 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base text-primary truncate w-full">
             {icon && <span className="h-4 w-4 shrink-0 flex items-center justify-center">{icon}</span>}
             <span className="truncate">{title}</span>
          </CardTitle>
          {headerActions && <div className="flex items-center ml-2 shrink-0">{headerActions}</div>}
        </CardHeader>
      )}
      
      <CardContent className={cn("flex-1 h-full min-h-0", paddingClass, contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}


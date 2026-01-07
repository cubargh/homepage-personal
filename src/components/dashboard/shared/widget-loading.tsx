"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetLoadingProps {
  /** Loading message (defaults to "Loading...") */
  message?: string;
  /** Whether to show the loading message text */
  showMessage?: boolean;
  /** Minimal mode for 1x1 widgets - smaller spinner, no text */
  isMinimal?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Standardized loading display component for widgets
 *
 * Consolidates the loading display pattern used across 13+ widgets.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return (
 *     <WidgetLayout gridSize={gridSize} title="Immich">
 *       <WidgetLoading message="Loading stats..." />
 *     </WidgetLayout>
 *   );
 * }
 * ```
 */
export function WidgetLoading({
  message = "Loading...",
  showMessage = true,
  isMinimal = false,
  className,
}: WidgetLoadingProps) {
  if (isMinimal) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-muted-foreground space-y-2 h-full",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      {showMessage && <p className="text-sm">{message}</p>}
    </div>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetErrorProps {
  /** Primary error message (defaults to "Connection Failed") */
  message?: string;
  /** Secondary hint text (e.g., "Check API Key & URL") */
  hint?: string;
  /** Whether to show the AlertTriangle icon */
  showIcon?: boolean;
  /** Minimal mode for 1x1 widgets - only shows icon */
  isMinimal?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Standardized error display component for widgets
 *
 * Consolidates the error display pattern used across 10+ widgets.
 *
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <WidgetLayout gridSize={gridSize} title="Immich">
 *       <WidgetError message="Connection Failed" hint="Check API Key & URL" />
 *     </WidgetLayout>
 *   );
 * }
 * ```
 */
export function WidgetError({
  message = "Connection Failed",
  hint,
  showIcon = true,
  isMinimal = false,
  className,
}: WidgetErrorProps) {
  if (isMinimal) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-destructive/80",
          className
        )}
      >
        <AlertTriangle className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-destructive/80 space-y-2 h-full",
        className
      )}
    >
      {showIcon && <AlertTriangle className="h-8 w-8" />}
      <p className="text-sm text-center">{message}</p>
      {hint && (
        <p className="text-xs text-muted-foreground text-center">{hint}</p>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { GridSize } from "@/types";

export interface WidgetLayoutMode {
  /** 1x1 grid size - icon/number only */
  isMinimal: boolean;
  /** 2x2 or smaller - compact view */
  isCompact: boolean;
  /** 3x3 or larger - full view */
  isStandard: boolean;
  /** Whether to show header (height >= 2) */
  showHeader: boolean;
  /** Tailwind padding class based on size */
  paddingClass: "p-2" | "p-3" | "p-4";
}

/**
 * Custom hook for calculating widget layout mode based on grid size
 *
 * Consolidates the layout calculation pattern used across 6+ widgets.
 *
 * @example
 * ```tsx
 * const { isMinimal, isCompact, isStandard, showHeader } = useWidgetLayout(gridSize);
 *
 * if (isMinimal) return <MinimalView />;
 * if (isCompact) return <CompactView />;
 * return <StandardView />;
 * ```
 */
export function useWidgetLayout(gridSize?: GridSize): WidgetLayoutMode {
  return useMemo(() => {
    if (!gridSize) {
      // Default to standard layout when gridSize is not provided
      return {
        isMinimal: false,
        isCompact: false,
        isStandard: true,
        showHeader: true,
        paddingClass: "p-4" as const,
      };
    }

    const { w, h } = gridSize;

    // Minimal: 1x1 grid - just show an icon or single number
    const isMinimal = w === 1 && h === 1;

    // Compact: 2x2 or smaller (but not 1x1)
    const isCompact = !isMinimal && w <= 2 && h <= 2;

    // Standard: anything larger than 2x2
    const isStandard = !isMinimal && !isCompact;

    // Show header when height is at least 2
    const showHeader = h >= 2;

    // Padding based on size
    const paddingClass = isMinimal ? "p-2" as const : isCompact ? "p-3" as const : "p-4" as const;

    return {
      isMinimal,
      isCompact,
      isStandard,
      showHeader,
      paddingClass,
    };
  }, [gridSize]);
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Label text below the value */
  label: string;
  /** The stat value to display */
  value: string | number | React.ReactNode;
  /** Show skeleton loader instead of value */
  loading?: boolean;
  /** Compact layout for smaller widgets */
  compact?: boolean;
  /** Large layout for standard widgets */
  large?: boolean;
  /** Icon color class (e.g., "text-blue-400") */
  iconColor?: string;
  /** Background gradient class (e.g., "from-blue-500/10 to-transparent") */
  gradient?: string;
  /** Column span (for grid layouts) */
  span?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable stat display component for widgets
 *
 * Consolidates the StatItem/MetricCard pattern used across 6+ widgets
 * (Immich, Jellyfin, Navidrome, Speedtest, Beszel, Ghostfolio).
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<ImageIcon className="h-4 w-4" />}
 *   label="Photos"
 *   value={data?.photos}
 *   loading={isLoading}
 *   compact={isCompact}
 * />
 * ```
 */
export function StatCard({
  icon,
  label,
  value,
  loading = false,
  compact = false,
  large = false,
  iconColor,
  gradient,
  span,
  className,
}: StatCardProps) {
  // Determine size classes
  const valueSize = compact ? "text-2xl" : large ? "text-2xl" : "text-lg md:text-xl";
  const skeletonSize = compact ? "h-8 w-20" : large ? "h-8 w-24" : "h-5 w-12";
  const labelSize = compact ? "text-[10px]" : "text-[10px] md:text-xs";
  const padding = compact ? "p-2" : "p-3";
  const spacing = compact ? "space-y-1" : "space-y-1.5";

  // Build class names
  const containerClasses = cn(
    "flex flex-col items-center justify-center rounded-md h-full",
    gradient ? `bg-gradient-to-br ${gradient}` : "bg-secondary/20",
    gradient && "border border-border/30 hover:border-border/50 transition-all",
    padding,
    spacing,
    span === 2 && "col-span-2",
    className
  );

  const iconClasses = cn(
    iconColor || "text-muted-foreground",
    compact && "mb-2"
  );

  const valueClasses = cn(
    valueSize,
    "font-bold leading-none text-foreground flex items-baseline gap-1"
  );

  const labelClasses = cn(
    labelSize,
    "text-muted-foreground uppercase tracking-wider font-medium",
    compact && "mt-2"
  );

  if (compact) {
    // Compact layout: Larger, more prominent display for small widgets
    return (
      <div className={cn(containerClasses, "w-full")}>
        <div className={iconClasses}>{icon}</div>
        {loading ? (
          <Skeleton className={skeletonSize} />
        ) : (
          <span className={valueClasses}>{value ?? 0}</span>
        )}
        <span className={labelClasses}>{label}</span>
      </div>
    );
  }

  // Standard/Large layout: Grid of stats
  return (
    <div className={containerClasses}>
      <div className={cn(iconClasses, "flex items-center gap-1.5")}>
        {icon}
        {/* Show label next to icon for metric card style */}
        {gradient && (
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            {label}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className={skeletonSize} />
      ) : (
        <span className={valueClasses}>{value ?? 0}</span>
      )}
      {/* Show label below value for standard stat item style */}
      {!gradient && <span className={labelClasses}>{label}</span>}
    </div>
  );
}

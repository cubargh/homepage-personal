import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isActive?: boolean;   // True if this widget is being dragged OR resized
  isResizing?: boolean; // True ONLY if this widget is being resized
}

export const WidgetWrapper = forwardRef<HTMLDivElement, WidgetWrapperProps>(
  ({ children, className, style, isActive, isResizing, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          // Base classes
          "relative h-full w-full",
          
          // Transition Logic:
          // - By default, transition everything (smooth reordering)
          // - If we are resizing THIS widget, disable transition to avoid lag/jitter
          !isResizing && "transition-all duration-200",
          
          // Scale/Lift Logic:
          // - Lift up if active (drag or resize) so it's above others
          isActive && "z-50",
          // - Scale up ONLY if dragging (not resizing), for visual feedback
          // - Scaling during resize causes cursor desync and border jitter
          (isActive && !isResizing) && "opacity-90 scale-[1.02] shadow-xl",
          
          className
        )}
        {...props}
      >
        {/* Inner container to handle select-none and full height */}
        <div className="h-full w-full select-none">{children}</div>
      </div>
    );
  }
);

WidgetWrapper.displayName = "WidgetWrapper";

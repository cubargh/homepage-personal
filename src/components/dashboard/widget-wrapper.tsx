import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Move, Maximize2 } from "lucide-react";

interface WidgetWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isActive?: boolean;   // True if this widget is being dragged OR resized
  isResizing?: boolean; // True ONLY if this widget is being resized
}

export const WidgetWrapper = forwardRef<HTMLDivElement, WidgetWrapperProps>(
  ({ children, className, style, isActive, isResizing, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          // Base classes
          "relative h-full w-full",
          // Ensure resize handle is not clipped
          // Note: Widget content that needs scrolling uses overflow-y-auto on their own containers,
          // so overflow-visible here doesn't affect widget scrolling behavior
          "overflow-visible",
          
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Inner container to handle select-none and full height */}
        <div 
          className="h-full w-full select-none"
          onMouseDown={(e) => {
             // Stop propagation if clicking on interactive elements
             // This is a backup for draggableCancel but good for select-none handling
          }}
        >
          {children}
        </div>

        {/* Drag Handle - Top Right */}
        <div 
          className={cn(
            "widget-drag-handle absolute top-[2px] right-[2px] w-5 h-5 flex items-center justify-center cursor-move z-[1001] transition-opacity duration-200",
            (isHovered || isActive) ? "opacity-70" : "opacity-0"
          )}
        >
          <Move className="w-2.5 h-2.5 text-foreground" />
        </div>

        {/* Resize Handle Icon Overlay - Bottom Right */}
        <div 
          className={cn(
            "widget-resize-handle-icon absolute bottom-[2px] right-[2px] w-5 h-5 flex items-center justify-center pointer-events-none z-[1001] transition-opacity duration-200",
            (isHovered || isActive) ? "opacity-70" : "opacity-0"
          )}
        >
          <Maximize2 className="w-2.5 h-2.5 text-foreground rotate-45" />
        </div>
      </div>
    );
  }
);

WidgetWrapper.displayName = "WidgetWrapper";

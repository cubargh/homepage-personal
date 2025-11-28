import React from "react";
import { GRID_MARGIN } from "@/config/grid";

interface GridBackgroundProps {
  cols: number;
  rowHeight: number;
  colWidth?: number; 
  show: boolean;
  padding?: [number, number];
}

export const GridBackground = ({ 
  rowHeight, 
  colWidth, 
  show, 
  padding = [0, 0] 
}: GridBackgroundProps) => {
  const margin = GRID_MARGIN[0]; // Assuming equal x/y margin for now
  const [paddingX, paddingY] = padding;

  if (!colWidth) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ease-in-out ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg 
        width="100%" 
        height="100%" 
        className="text-primary opacity-30" // Cyan color via text-primary, low opacity
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id="grid-pattern" 
            width={colWidth + margin} 
            height={rowHeight + margin} 
            patternUnits="userSpaceOnUse"
            x={paddingX}
            y={paddingY}
          >
            <rect 
              x={0} 
              y={0} 
              width={colWidth} 
              height={rowHeight} 
              rx={12} 
              ry={12} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
};

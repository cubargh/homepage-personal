"use client";

import { useEffect } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch theme");
  }
  return res.json();
};

// Helper function to convert hex/rgb/oklch to CSS value
// Supports hex (#ffffff), rgb/rgba, oklch, and named colors
const normalizeColor = (color: string): string => {
  if (!color) return "";
  
  // If it's already a valid CSS color format, return as-is
  // Check for oklch, rgb, rgba, hsl, hsla, or named colors
  if (
    color.startsWith("oklch(") ||
    color.startsWith("rgb(") ||
    color.startsWith("rgba(") ||
    color.startsWith("hsl(") ||
    color.startsWith("hsla(") ||
    /^[a-z]+$/i.test(color) // Named colors like "red", "blue", etc.
  ) {
    return color;
  }
  
  // If it's a hex color, ensure it has #
  if (color.match(/^[0-9A-Fa-f]{6}$/)) {
    return `#${color}`;
  }
  
  if (color.startsWith("#")) {
    return color;
  }
  
  // Default: return as-is (might be a CSS variable or other format)
  return color;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSWR("/api/theme", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (!data?.theme) return;

    const theme = data.theme;
    const root = document.documentElement;
    
    // Debug: log theme application
    if (process.env.NODE_ENV === 'development') {
      console.log('Applying theme:', theme);
    }

    // Apply theme colors as CSS variables
    if (theme.grid_background) {
      const gridColor = normalizeColor(theme.grid_background);
      root.style.setProperty("--theme-grid-background", gridColor);
      // Also set --background since Tailwind uses it for bg-background class
      root.style.setProperty("--background", gridColor);
      // Disable gradient when solid color is provided
      root.style.setProperty("--theme-grid-gradient", "none");
    } else {
      // Re-enable default gradient if grid_background is not set
      root.style.removeProperty("--theme-grid-gradient");
      // Reset --background to default if grid_background is removed
      root.style.removeProperty("--background");
    }
    
    if (theme.card_background) {
      root.style.setProperty("--card", normalizeColor(theme.card_background));
      root.style.setProperty("--popover", normalizeColor(theme.card_background));
    }
    
    if (theme.accent) {
      const accentColor = normalizeColor(theme.accent);
      // Apply accent to both accent and primary CSS variables
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--primary", accentColor);
      root.style.setProperty("--ring", accentColor);
      // Also update chart colors to use accent
      root.style.setProperty("--chart-1", accentColor);
    }
    
    if (theme.border) {
      root.style.setProperty("--border", normalizeColor(theme.border));
      root.style.setProperty("--input", normalizeColor(theme.border));
    }
    
    if (theme.foreground) {
      root.style.setProperty("--foreground", normalizeColor(theme.foreground));
      root.style.setProperty("--card-foreground", normalizeColor(theme.foreground));
      root.style.setProperty("--popover-foreground", normalizeColor(theme.foreground));
    }
    
    if (theme.muted_foreground) {
      root.style.setProperty("--muted-foreground", normalizeColor(theme.muted_foreground));
    }

    // Cleanup function to reset styles when component unmounts or theme changes
    return () => {
      if (theme.grid_background) {
        root.style.removeProperty("--theme-grid-background");
        root.style.removeProperty("--background");
        root.style.removeProperty("--theme-grid-gradient");
      }
      if (theme.card_background) {
        root.style.removeProperty("--card");
        root.style.removeProperty("--popover");
      }
      if (theme.accent) {
        root.style.removeProperty("--accent");
        root.style.removeProperty("--primary");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--chart-1");
      }
      if (theme.border) {
        root.style.removeProperty("--border");
        root.style.removeProperty("--input");
      }
      if (theme.foreground) {
        root.style.removeProperty("--foreground");
        root.style.removeProperty("--card-foreground");
        root.style.removeProperty("--popover-foreground");
      }
      if (theme.muted_foreground) {
        root.style.removeProperty("--muted-foreground");
      }
    };
  }, [data]);

  return <>{children}</>;
}


import type { ThemeConfig } from "@/lib/config";

// Helper to normalize color (same as ThemeProvider)
export const normalizeColor = (color: string): string => {
  if (!color) return "";
  if (
    color.startsWith("oklch(") ||
    color.startsWith("rgb(") ||
    color.startsWith("rgba(") ||
    color.startsWith("hsl(") ||
    color.startsWith("hsla(") ||
    /^[a-z]+$/i.test(color)
  ) {
    return color;
  }
  if (color.match(/^[0-9A-Fa-f]{6}$/)) {
    return `#${color}`;
  }
  if (color.startsWith("#")) {
    return color;
  }
  return color;
};

// Convert color to hex for color input (color inputs only support hex)
export const colorToHex = (color: string): string => {
  if (!color) return "#000000";
  if (color.startsWith("#")) {
    return color.length === 7 ? color : color.padEnd(7, "0");
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#000000";
};

// Apply preview theme to document
export const applyPreviewTheme = (theme: Partial<ThemeConfig>) => {
  const root = document.documentElement;

  if (theme.grid_background) {
    const gridColor = normalizeColor(theme.grid_background);
    root.style.setProperty("--theme-grid-background", gridColor);
    root.style.setProperty("--background", gridColor);
    root.style.setProperty("--theme-grid-gradient", "none");
  }

  if (theme.card_background) {
    root.style.setProperty("--card", normalizeColor(theme.card_background));
    root.style.setProperty("--popover", normalizeColor(theme.card_background));
  }

  if (theme.accent) {
    const accentColor = normalizeColor(theme.accent);
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty("--primary", accentColor);
    root.style.setProperty("--ring", accentColor);
    root.style.setProperty("--chart-1", accentColor);
  }

  if (theme.border) {
    root.style.setProperty("--border", normalizeColor(theme.border));
    root.style.setProperty("--input", normalizeColor(theme.border));
  }

  if (theme.foreground) {
    root.style.setProperty("--foreground", normalizeColor(theme.foreground));
    root.style.setProperty(
      "--card-foreground",
      normalizeColor(theme.foreground)
    );
    root.style.setProperty(
      "--popover-foreground",
      normalizeColor(theme.foreground)
    );
  }

  if (theme.muted_foreground) {
    root.style.setProperty(
      "--muted-foreground",
      normalizeColor(theme.muted_foreground)
    );
  }

  if (theme.widget_corner_radius) {
    root.style.setProperty(
      "--widget-corner-radius",
      theme.widget_corner_radius
    );
  }
};

// Reset preview theme (remove overrides)
export const resetPreviewTheme = () => {
  const root = document.documentElement;
  root.style.removeProperty("--theme-grid-background");
  root.style.removeProperty("--background");
  root.style.removeProperty("--theme-grid-gradient");
  root.style.removeProperty("--card");
  root.style.removeProperty("--popover");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--chart-1");
  root.style.removeProperty("--border");
  root.style.removeProperty("--input");
  root.style.removeProperty("--foreground");
  root.style.removeProperty("--card-foreground");
  root.style.removeProperty("--popover-foreground");
  root.style.removeProperty("--muted-foreground");
  root.style.removeProperty("--widget-corner-radius");
};

// Generate YAML config snippet
export const generateThemeYAML = (theme: Partial<ThemeConfig>): string => {
  const lines: string[] = ["theme:"];

  if (theme.grid_background) {
    lines.push(`  grid_background: "${theme.grid_background}"`);
  }
  if (theme.card_background) {
    lines.push(`  card_background: "${theme.card_background}"`);
  }
  if (theme.accent) {
    lines.push(`  accent: "${theme.accent}"`);
  }
  if (theme.border) {
    lines.push(`  border: "${theme.border}"`);
  }
  if (theme.foreground) {
    lines.push(`  foreground: "${theme.foreground}"`);
  }
  if (theme.muted_foreground) {
    lines.push(`  muted_foreground: "${theme.muted_foreground}"`);
  }
  if (theme.widget_corner_radius) {
    lines.push(`  widget_corner_radius: "${theme.widget_corner_radius}"`);
  }

  return lines.join("\n");
};


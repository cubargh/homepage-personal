"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, RotateCcw, Palette, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import type { ThemeConfig } from "@/lib/config";
import {
  colorToHex,
  applyPreviewTheme,
  resetPreviewTheme,
  generateThemeYAML,
} from "@/lib/theme-utils";

interface ThemePreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch theme");
  return res.json();
};

export function ThemePreviewPopup({ isOpen, onClose }: ThemePreviewPopupProps) {
  // Always fetch theme data so we can restore it when closing
  const { data: themeData } = useSWR<{ theme: ThemeConfig }>(
    "/api/theme",
    fetcher
  );

  const [previewTheme, setPreviewTheme] = useState<Partial<ThemeConfig>>({});
  const [copied, setCopied] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const pendingThemeRef = React.useRef<Partial<ThemeConfig>>({});
  const copyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize preview theme from current theme when popup opens
  useEffect(() => {
    if (isOpen && themeData?.theme) {
      setPreviewTheme(themeData.theme);
    }
  }, [isOpen, themeData?.theme]);

  const handleCopyConfig = useCallback(async () => {
    const yaml = generateThemeYAML(previewTheme);
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setCopyError(false);
      
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyError(true);
      setCopied(false);
      
      // Auto-hide error after 3 seconds
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopyError(false);
        copyTimeoutRef.current = null;
      }, 3000);
    }
  }, [previewTheme]);

  // Apply preview theme when it changes (for text input changes)
  useEffect(() => {
    if (!isOpen || Object.keys(previewTheme).length === 0) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      applyPreviewTheme(previewTheme);
      pendingThemeRef.current = previewTheme;
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [previewTheme, isOpen]);

  // Reset preview when popup closes - reapply original theme
  useEffect(() => {
    if (!isOpen) {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
      pendingThemeRef.current = {};

      // Reapply original theme from config
      if (themeData?.theme) {
        requestAnimationFrame(() => {
          applyPreviewTheme(themeData.theme);
        });
      } else {
        resetPreviewTheme();
      }

      setHasPreview(false);
      setPreviewTheme({});
      setCopied(false);
      setCopyError(false);
    }
  }, [isOpen, themeData?.theme]);

  // Keyboard shortcuts: ESC to close, Ctrl/Cmd + Enter to copy
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleCopyConfig();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handleCopyConfig]);

  const handleColorChange = (key: keyof ThemeConfig, value: string) => {
    pendingThemeRef.current = { ...pendingThemeRef.current, [key]: value };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        applyPreviewTheme(pendingThemeRef.current);
        rafRef.current = null;
      });
    }

    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewTheme(pendingThemeRef.current);
      if (!hasPreview) {
        setHasPreview(true);
      }
      previewTimeoutRef.current = null;
    }, 100);
  };

  const handleResetPreview = () => {
    resetPreviewTheme();
    if (themeData?.theme) {
      setPreviewTheme(themeData.theme);
    } else {
      setPreviewTheme({});
    }
    setHasPreview(false);
  };

  const hasChanges =
    themeData?.theme &&
    JSON.stringify(previewTheme) !== JSON.stringify(themeData.theme);

  if (!isOpen) return null;

  return (
    <>
      {/* Popup - Bottom Right */}
      <div
        className={cn(
          "fixed bottom-4 right-4 w-[500px] max-h-[90vh] bg-card border border-border rounded-lg shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Theme Preview</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-muted-foreground mb-4">
            Preview theme colors and copy the config to paste into your
            config.yaml file.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Grid Background
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(
                    previewTheme.grid_background || "#000000"
                  )}
                  onChange={(e) => {
                    handleColorChange("grid_background", e.target.value);
                  }}
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.grid_background || ""}
                  onChange={(e) =>
                    handleColorChange("grid_background", e.target.value)
                  }
                  placeholder="oklch(0.05 0 0)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Card Background
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(
                    previewTheme.card_background || "#000000"
                  )}
                  onChange={(e) =>
                    handleColorChange("card_background", e.target.value)
                  }
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.card_background || ""}
                  onChange={(e) =>
                    handleColorChange("card_background", e.target.value)
                  }
                  placeholder="oklch(0.17 0 0)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(previewTheme.accent || "#000000")}
                  onChange={(e) =>
                    handleColorChange("accent", e.target.value)
                  }
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.accent || ""}
                  onChange={(e) =>
                    handleColorChange("accent", e.target.value)
                  }
                  placeholder="oklch(0.7 0.15 220)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Border Color
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(previewTheme.border || "#000000")}
                  onChange={(e) =>
                    handleColorChange("border", e.target.value)
                  }
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.border || ""}
                  onChange={(e) =>
                    handleColorChange("border", e.target.value)
                  }
                  placeholder="oklch(0.20 0 0)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Foreground (Text)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(previewTheme.foreground || "#000000")}
                  onChange={(e) =>
                    handleColorChange("foreground", e.target.value)
                  }
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.foreground || ""}
                  onChange={(e) =>
                    handleColorChange("foreground", e.target.value)
                  }
                  placeholder="oklch(0.985 0 0)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Muted Foreground
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={colorToHex(
                    previewTheme.muted_foreground || "#000000"
                  )}
                  onChange={(e) =>
                    handleColorChange("muted_foreground", e.target.value)
                  }
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewTheme.muted_foreground || ""}
                  onChange={(e) =>
                    handleColorChange("muted_foreground", e.target.value)
                  }
                  placeholder="oklch(0.7 0 0)"
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Widget Corner Radius
              </label>
              <Input
                type="text"
                value={previewTheme.widget_corner_radius || ""}
                onChange={(e) =>
                  handleColorChange("widget_corner_radius", e.target.value)
                }
                placeholder="0.75rem"
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPreview}
              disabled={!hasChanges}
              className="gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyConfig}
              className="gap-2 flex-1"
              title="Copy config (Ctrl/Cmd + Enter)"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : copyError ? (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Copy Failed
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Theme Config
                </>
              )}
            </Button>
          </div>
          {hasChanges && (
            <p className="text-xs text-muted-foreground mt-2">
              Preview active. Copy the config above and paste it into your
              config.yaml file.
            </p>
          )}
          {copyError && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Failed to copy to clipboard. Please copy manually.
            </p>
          )}
        </div>
      </div>
    </>
  );
}


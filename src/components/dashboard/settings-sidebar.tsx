import React, { useState, useEffect } from "react";
import { X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemePreviewPopup } from "./theme-preview-popup";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isThemePopupOpen, setIsThemePopupOpen] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (showClearConfirm) {
      // Auto-hide confirmation after 3 seconds
      timeoutId = setTimeout(() => setShowClearConfirm(false), 3000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showClearConfirm]);

  const handleClearLocalStorage = () => {
    if (showClearConfirm) {
      // Set flag to reset widgets to 2x2 default sizes
      sessionStorage.setItem("reset-to-default-sizes", "true");
      localStorage.clear();
      setShowClearConfirm(false);
      // Reload page to apply changes
      window.location.reload();
    } else {
      setShowClearConfirm(true);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-[400px] bg-background border-r z-50 transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Theme Preview Button */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Appearance</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsThemePopupOpen(true);
                  onClose(); // Close sidebar when opening theme preview
                }}
                className="gap-2 w-full"
              >
                <Palette className="h-4 w-4" />
                Theme Preview
              </Button>
            </div>

            {/* Storage Section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Storage</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLocalStorage}
                title={
                  showClearConfirm
                    ? "Click again to confirm"
                    : "Clear local storage"
                }
                className={showClearConfirm ? "text-destructive" : ""}
              >
                {showClearConfirm ? "Confirm Clear" : "Clear Storage"}
              </Button>
              {showClearConfirm && (
                <p className="text-xs text-muted-foreground mt-2">
                  Click again to confirm clearing all local storage data
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Preview Popup */}
      <ThemePreviewPopup
        isOpen={isThemePopupOpen}
        onClose={() => setIsThemePopupOpen(false)}
      />
    </>
  );
}

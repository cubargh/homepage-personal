import React, { useState, useEffect, useRef } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function ConfigEditor({
  onFileInfoChange,
}: {
  onFileInfoChange?: (info: { path: string; isExample: boolean }) => void;
}) {
  const [configContent, setConfigContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configPath, setConfigPath] = useState("");
  const [isExample, setIsExample] = useState(false);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(400);

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (onFileInfoChange && configPath) {
      onFileInfoChange({ path: configPath, isExample });
    }
  }, [configPath, isExample, onFileInfoChange]);

  // Measure editor container height
  useEffect(() => {
    const updateHeight = () => {
      if (editorContainerRef.current) {
        // Get the actual available height for the editor
        const rect = editorContainerRef.current.getBoundingClientRect();
        const height = Math.floor(rect.height);
        if (height > 0 && height !== editorHeight) {
          setEditorHeight(height);
        }
      }
    };

    // Initial measurement with multiple attempts to ensure it's measured after render
    const timeoutId1 = setTimeout(updateHeight, 0);
    const timeoutId2 = setTimeout(updateHeight, 100);
    const timeoutId3 = setTimeout(updateHeight, 300);

    // Update on window resize
    window.addEventListener("resize", updateHeight);

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (editorContainerRef.current) {
      resizeObserver.observe(editorContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, [editorHeight]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/config");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Please log in.");
        } else {
          setError("Failed to load config file");
        }
        return;
      }

      const data = await response.json();
      setConfigContent(data.content);
      setOriginalContent(data.content);
      setConfigPath(data.path);
      setIsExample(data.isExample || false);
    } catch (err) {
      setError("Failed to load config file");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: configContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || "Failed to save config");
        return;
      }

      setSuccess("Config saved successfully! The page will reload.");
      setOriginalContent(configContent);

      // Reload page after 1.5 seconds to apply changes
      reloadTimeoutRef.current = setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save config";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = configContent !== originalContent;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading config...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File info */}
      {isExample && (
        <div className="mb-4 p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Editing example config. Save to create config.yaml</span>
        </div>
      )}

      {/* Error/Success messages */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Editor with CodeMirror */}
      <div
        ref={editorContainerRef}
        className="flex-1 border rounded-md min-h-0 overflow-hidden"
      >
        <CodeMirror
          value={configContent}
          height={editorHeight > 0 ? `${editorHeight}px` : "400px"}
          extensions={[yaml()]}
          theme={oneDark}
          onChange={(value) => {
            setConfigContent(value);
            setError(null);
            setSuccess(null);
          }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            highlightSelectionMatches: false,
          }}
        />
      </div>

      {/* Footer with actions */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-4 border-t">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <p className="text-xs text-muted-foreground">
              You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadConfig}
            disabled={isSaving || isLoading}
          >
            Reload
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfigContent(originalContent);
                setError(null);
                setSuccess(null);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
          )}
          <Button
            onClick={saveConfig}
            disabled={isSaving || !hasChanges}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [fileInfo, setFileInfo] = useState<{
    path: string;
    isExample: boolean;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
          "fixed top-0 left-0 h-full w-[800px] bg-background border-r z-50 transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onWheel={(e) => {
          // Only stop propagation if NOT scrolling within CodeMirror
          const target = e.target as HTMLElement;
          const isInCodeMirror =
            target.closest(".cm-scroller") || target.closest(".cm-editor");
          if (!isInCodeMirror) {
            e.stopPropagation();
          }
        }}
      >
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Config Editor</h2>
            {fileInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {fileInfo.isExample
                  ? "config.example.yaml"
                  : fileInfo.path.split("/").pop()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLocalStorage}
              title={
                showClearConfirm
                  ? "Click again to confirm"
                  : "Clear local storage"
              }
              className={showClearConfirm ? "text-destructive" : ""}
            >
              {showClearConfirm ? "Confirm Clear" : "Clear LocalStorage"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-hidden p-4"
          onWheel={(e) => {
            // Only stop propagation if NOT scrolling within CodeMirror
            const target = e.target as HTMLElement;
            const isInCodeMirror =
              target.closest(".cm-scroller") || target.closest(".cm-editor");
            if (!isInCodeMirror) {
              e.stopPropagation();
            }
          }}
        >
          <ConfigEditor onFileInfoChange={setFileInfo} />
        </div>
      </div>
    </>
  );
}

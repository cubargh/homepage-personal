"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShortcutConfig, ServiceConfig } from "@/types";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Globe, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpotlightConfig {
  search_engine?: "google" | "duckduckgo" | "bing" | "custom";
  custom_search_url?: string;
}

interface SpotlightItem {
  id: string;
  type: "shortcut" | "service" | "search" | "url";
  name: string;
  url: string;
  icon?: string;
}

interface SpotlightProps {
  shortcuts: ShortcutConfig[];
  services: ServiceConfig[];
  spotlightConfig: SpotlightConfig;
}

const SEARCH_ENGINE_URLS: Record<string, string> = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};

export function Spotlight({ shortcuts, services, spotlightConfig }: SpotlightProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check if a string is a valid URL (without protocol)
  const isValidUrl = (str: string): boolean => {
    // Remove leading/trailing whitespace
    const trimmed = str.trim();
    if (!trimmed) return false;

    // Check if it contains spaces (URLs shouldn't)
    if (trimmed.includes(" ")) return false;

    // Simple domain pattern: must contain at least one dot and valid characters
    // Examples: facebook.com, sub.example.com, localhost (special case)
    if (trimmed === "localhost") return true;
    
    // Must have at least one dot to be considered a domain
    if (!trimmed.includes(".")) return false;
    
    // Basic domain validation: alphanumeric, dots, hyphens
    // Must start and end with alphanumeric
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    return domainPattern.test(trimmed);
  };

  // Generate search URL based on config
  const getSearchUrl = useCallback((searchQuery: string): string => {
    if (spotlightConfig.search_engine === "custom" && spotlightConfig.custom_search_url) {
      return spotlightConfig.custom_search_url.replace("{query}", encodeURIComponent(searchQuery));
    }
    const engine = spotlightConfig.search_engine || "google";
    const baseUrl = SEARCH_ENGINE_URLS[engine] || SEARCH_ENGINE_URLS.google;
    return baseUrl + encodeURIComponent(searchQuery);
  }, [spotlightConfig]);

  // Generate results based on query
  const getResults = useCallback((): SpotlightItem[] => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return [];

    const results: SpotlightItem[] = [];

    // Check if it's a URL (use original query for display, trimmed for validation)
    const originalQuery = query.trim();
    if (isValidUrl(trimmedQuery)) {
      results.push({
        id: "url",
        type: "url",
        name: `Go to ${originalQuery}`,
        url: `https://${originalQuery}`,
      });
    }

    // Filter shortcuts
    shortcuts.forEach((shortcut) => {
      if (shortcut.name.toLowerCase().includes(trimmedQuery)) {
        results.push({
          id: `shortcut-${shortcut.url}`,
          type: "shortcut",
          name: shortcut.name,
          url: shortcut.url,
          icon: shortcut.icon,
        });
      }
    });

    // Filter services
    services.forEach((service) => {
      if (service.name.toLowerCase().includes(trimmedQuery)) {
        results.push({
          id: `service-${service.url}`,
          type: "service",
          name: service.name,
          url: service.url,
          icon: service.icon,
        });
      }
    });

    // Add search option if query doesn't match URL pattern
    if (!isValidUrl(trimmedQuery)) {
      results.push({
        id: "search",
        type: "search",
        name: `Search for "${originalQuery}"`,
        url: getSearchUrl(originalQuery),
      });
    }

    return results;
  }, [query, shortcuts, services, getSearchUrl]);

  const results = getResults();

  // Handle keyboard events globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't open if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // If spotlight is already open and user presses Escape, close it
        if (e.key === "Escape" && isOpen) {
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }
        return;
      }

      // Open spotlight when user starts typing (single character, not modifier keys)
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isOpen
      ) {
        setIsOpen(true);
        setQuery(e.key);
        setSelectedIndex(0);
        e.preventDefault();
        e.stopPropagation();
        // Focus the input after state update
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle navigation
  const navigateTo = (item: SpotlightItem) => {
    window.open(item.url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
      navigateTo(results[selectedIndex]);
    } else if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      setSelectedIndex(0);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex, results.length]);

  // Note: Closing on outside click is handled by the backdrop div

  if (!isOpen) return null;

  const getIcon = (item: SpotlightItem) => {
    if (item.icon) {
      if (item.icon.startsWith("http") || item.icon.startsWith("https")) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon}
            alt={item.name}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        );
      } else {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://cdn.jsdelivr.net/gh/selfhst/icons/png/${item.icon}.png`}
            alt={item.name}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        );
      }
    }

    switch (item.type) {
      case "shortcut":
        return <Link2 className="w-5 h-5" />;
      case "service":
        return <Globe className="w-5 h-5" />;
      case "search":
        return <Search className="w-5 h-5" />;
      case "url":
        return <ExternalLink className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }}
      />
      
      {/* Spotlight Modal */}
      <div
        data-spotlight
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none"
      >
        <div className="w-full max-w-2xl mx-4 pointer-events-auto">
        <Card className="border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type to search shortcuts, services, or URLs..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                autoFocus
              />
            </div>

            {results.length > 0 && (
              <div
                ref={resultsRef}
                className="max-h-[60vh] overflow-y-auto space-y-1"
              >
                {results.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      index === selectedIndex && "bg-accent"
                    )}
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.url}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground text-xs">
                      {index === selectedIndex && "↵"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No results found</p>
              </div>
            )}

            {!query.trim() && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Start typing to search...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}


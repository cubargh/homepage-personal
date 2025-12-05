"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShortcutConfig, ServiceConfig } from "@/types";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Globe, Link2, ExternalLink, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpotlightConfig {
  search_engine?: "google" | "duckduckgo" | "bing" | "custom";
  custom_search_url?: string;
  fuzzy_search?: boolean;
}

interface SpotlightItem {
  id: string;
  type: "shortcut" | "service" | "search" | "url";
  name: string;
  url: string;
  icon?: string;
  matchScore?: number; // For fuzzy search scoring
  matchIndices?: number[]; // Indices of matched characters for highlighting
  isExactMatch?: boolean; // True if this is an exact match
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

export function Spotlight({
  shortcuts,
  services,
  spotlightConfig,
}: SpotlightProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const useFuzzySearch = spotlightConfig.fuzzy_search ?? false;

  // Fuzzy search algorithm - checks if query matches text with character order flexibility
  const fuzzyMatch = useCallback(
    (
      text: string,
      query: string
    ): {
      match: boolean;
      score: number;
      indices: number[];
      isExact: boolean;
    } => {
      const textLower = text.toLowerCase();
      const queryLower = query.toLowerCase();

      if (!queryLower) {
        return { match: true, score: 0, indices: [], isExact: false };
      }

      // Exact match gets highest score
      if (textLower === queryLower) {
        return {
          match: true,
          score: 100,
          indices: Array.from({ length: query.length }, (_, i) => i),
          isExact: true,
        };
      }

      // Starts with gets high score
      if (textLower.startsWith(queryLower)) {
        return {
          match: true,
          score: 90,
          indices: Array.from({ length: query.length }, (_, i) => i),
          isExact: false,
        };
      }

      // Contains gets medium score
      const containsIndex = textLower.indexOf(queryLower);
      if (containsIndex !== -1) {
        return {
          match: true,
          score: 70,
          indices: Array.from(
            { length: query.length },
            (_, i) => containsIndex + i
          ),
          isExact: false,
        };
      }

      // Fuzzy match: characters appear in order but not necessarily consecutive
      let textIndex = 0;
      let queryIndex = 0;
      const indices: number[] = [];

      while (textIndex < textLower.length && queryIndex < queryLower.length) {
        if (textLower[textIndex] === queryLower[queryIndex]) {
          indices.push(textIndex);
          queryIndex++;
        }
        textIndex++;
      }

      if (queryIndex === queryLower.length) {
        // Calculate score based on how close the matches are
        const avgDistance =
          indices.length > 1
            ? indices.reduce(
                (sum, idx, i) => sum + (i > 0 ? idx - indices[i - 1] : 0),
                0
              ) /
              (indices.length - 1)
            : 0;
        const score = Math.max(30, 60 - avgDistance * 5); // Score decreases as distance increases
        return { match: true, score, indices, isExact: false };
      }

      return { match: false, score: 0, indices: [], isExact: false };
    },
    []
  );

  // Highlight matching text in result
  const highlightText = useCallback(
    (text: string, indices: number[]): React.ReactNode => {
      if (indices.length === 0) return text;

      // Sort indices to ensure they're in order
      const sortedIndices = [...indices].sort((a, b) => a - b);
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let highlightStart = -1;
      let highlightEnd = -1;

      sortedIndices.forEach((idx) => {
        if (highlightStart === -1) {
          // Start new highlight
          highlightStart = idx;
          highlightEnd = idx;
        } else if (idx === highlightEnd + 1) {
          // Continue current highlight
          highlightEnd = idx;
        } else {
          // End current highlight and start new one
          if (highlightStart > lastIndex) {
            parts.push(text.slice(lastIndex, highlightStart));
          }
          parts.push(
            <span
              key={`highlight-${highlightStart}`}
              className="bg-primary/20 text-primary font-medium"
            >
              {text.slice(highlightStart, highlightEnd + 1)}
            </span>
          );
          lastIndex = highlightEnd + 1;
          highlightStart = idx;
          highlightEnd = idx;
        }
      });

      // Add final highlight
      if (highlightStart !== -1) {
        if (highlightStart > lastIndex) {
          parts.push(text.slice(lastIndex, highlightStart));
        }
        parts.push(
          <span
            key={`highlight-${highlightStart}`}
            className="bg-primary/20 text-primary font-medium"
          >
            {text.slice(highlightStart, highlightEnd + 1)}
          </span>
        );
        lastIndex = highlightEnd + 1;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return <>{parts}</>;
    },
    []
  );

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
    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    return domainPattern.test(trimmed);
  };

  // Generate search URL based on config
  const getSearchUrl = useCallback(
    (searchQuery: string): string => {
      if (
        spotlightConfig.search_engine === "custom" &&
        spotlightConfig.custom_search_url
      ) {
        return spotlightConfig.custom_search_url.replace(
          "{query}",
          encodeURIComponent(searchQuery)
        );
      }
      const engine = spotlightConfig.search_engine || "google";
      const baseUrl = SEARCH_ENGINE_URLS[engine] || SEARCH_ENGINE_URLS.google;
      return baseUrl + encodeURIComponent(searchQuery);
    },
    [spotlightConfig]
  );

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
        matchScore: 100,
        matchIndices: [],
        isExactMatch: true, // URLs are always exact matches
      });
    }

    // Filter shortcuts
    shortcuts.forEach((shortcut) => {
      const shortcutNameLower = shortcut.name.toLowerCase();
      const isExactMatch = shortcutNameLower === trimmedQuery;
      const nameMatch = useFuzzySearch
        ? fuzzyMatch(shortcut.name, trimmedQuery)
        : {
            match: shortcut.name.toLowerCase().includes(trimmedQuery),
            score: isExactMatch
              ? 100
              : shortcut.name.toLowerCase().includes(trimmedQuery)
              ? 50
              : 0,
            indices: [],
            isExact: isExactMatch,
          };

      if (nameMatch.match) {
        results.push({
          id: `shortcut-${shortcut.url}`,
          type: "shortcut",
          name: shortcut.name,
          url: shortcut.url,
          icon: shortcut.icon,
          matchScore: nameMatch.score,
          matchIndices: nameMatch.indices,
          isExactMatch: nameMatch.isExact,
        });
      }
    });

    // Filter services
    services.forEach((service) => {
      const serviceNameLower = service.name.toLowerCase();
      const isExactMatch = serviceNameLower === trimmedQuery;
      const nameMatch = useFuzzySearch
        ? fuzzyMatch(service.name, trimmedQuery)
        : {
            match: service.name.toLowerCase().includes(trimmedQuery),
            score: isExactMatch
              ? 100
              : service.name.toLowerCase().includes(trimmedQuery)
              ? 50
              : 0,
            indices: [],
            isExact: isExactMatch,
          };

      if (nameMatch.match) {
        results.push({
          id: `service-${service.url}`,
          type: "service",
          name: service.name,
          url: service.url,
          icon: service.icon,
          matchScore: nameMatch.score,
          matchIndices: nameMatch.indices,
          isExactMatch: nameMatch.isExact,
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
        matchScore: 10,
        matchIndices: [],
        isExactMatch: false, // Search is never an exact match
      });
    }

    // Sort: exact matches first, then by match score (highest first)
    return results.sort((a, b) => {
      // Prioritize exact matches
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      // If both are exact or both are not, sort by score
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  }, [query, shortcuts, services, getSearchUrl, useFuzzySearch, fuzzyMatch]);

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

      // Open spotlight with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "k" &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        setQuery("");
        setSelectedIndex(0);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
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
  const navigateTo = (item: SpotlightItem, openInNewTab: boolean = false) => {
    if (openInNewTab) {
      const newWindow = window.open(item.url, "_blank", "noopener,noreferrer");
      // Try to focus the new window/tab (browser may prevent this due to security)
      if (newWindow) {
        newWindow.focus();
      }
    } else {
      window.location.href = item.url;
    }
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  // Handle input keyboard events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      results.length > 0 &&
      selectedIndex >= 0 &&
      selectedIndex < results.length
    ) {
      // Check if Ctrl/Cmd+Enter for new tab
      const openInNewTab = e.ctrlKey || e.metaKey;
      navigateTo(results[selectedIndex], openInNewTab);
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

  // Reset selected index when results change
  useEffect(() => {
    if (selectedIndex >= results.length && results.length > 0) {
      setSelectedIndex(0);
    }
  }, [results.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (
      resultsRef.current &&
      results.length > 0 &&
      selectedIndex < results.length
    ) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
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
                  onKeyDown={handleInputKeyDown}
                  className="text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  autoFocus
                />
                <div className="flex-shrink-0 text-xs text-muted-foreground hidden sm:block">
                  <kbd className="px-2 py-1 bg-muted rounded border border-border">
                    {typeof navigator !== "undefined" &&
                    navigator.platform.includes("Mac")
                      ? "⌘"
                      : "Ctrl"}
                  </kbd>
                  <kbd className="px-2 py-1 bg-muted rounded border border-border ml-1">
                    K
                  </kbd>
                </div>
              </div>

              {results.length > 0 && (
                <div
                  ref={resultsRef}
                  className="max-h-[60vh] overflow-y-auto space-y-1"
                >
                  {results.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                        "hover:bg-card",
                        index === selectedIndex && "bg-card"
                      )}
                    >
                      <button
                        onClick={() => navigateTo(item, false)}
                        className={cn(
                          "flex-1 flex items-center gap-3 text-left focus:outline-none min-w-0"
                        )}
                      >
                        <div className="flex-shrink-0 text-muted-foreground">
                          {getIcon(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.matchIndices && item.matchIndices.length > 0
                              ? highlightText(item.name, item.matchIndices)
                              : item.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.url}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-muted-foreground text-xs">
                          {index === selectedIndex && "↵"}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo(item, true);
                        }}
                        className={cn(
                          "flex-shrink-0 p-1.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none",
                          index === selectedIndex && "opacity-100"
                        )}
                        title="Open in new tab"
                        aria-label="Open in new tab"
                      >
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
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

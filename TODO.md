# Widget Revamping TODO

This document tracks widgets that need to be revamped to use the new `WidgetLayout` system with `gridSize` support and compact/standard modes.

## ✅ Completed Widgets

- **Service Monitor** (`service-widget.tsx`) - ✅ Revamped with config-driven columns/rows/compactMode
- **Weather** (`weather-widget.tsx`) - ✅ Revamped with minimal/compact/standard modes
- **Ghostfolio** (`ghostfolio-widget.tsx`) - ✅ Revamped with compact/standard modes
- **Immich** (`immich-widget.tsx`) - ✅ Revamped with compact/standard modes
- **Calendar** (`calendar-widget.tsx`) - ✅ Revamped with compact/standard modes and custom color support

## 📋 Widgets Pending Revamp

### 1. Jellyfin Widget (`jellyfin-widget.tsx`)

- **Current Status**: Uses custom `Card` components
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show key stats only
  - Implement standard mode (3x3+): Show full stats + latest content
  - Hide title/icon in compact mode

### 2. Navidrome Widget (`navidrome-widget.tsx`)

- **Current Status**: Uses custom `Card` components
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show key stats only (total songs, artists)
  - Implement standard mode (3x3+): Show all stats + now playing
  - Hide title/icon in compact mode

### 3. qBittorrent Widget (`qbittorrent-widget.tsx`)

- **Current Status**: Uses custom `Card` components
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show download/upload speeds only
  - Implement standard mode (3x3+): Show speeds + active torrents list
  - Hide title/icon in compact mode

### 4. F1 Widget (`f1-widget.tsx`)

- **Current Status**: Uses custom `Card` components
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show next race countdown only
  - Implement standard mode (3x3+): Show full race info + standings
  - Hide title/icon in compact mode

### 5. Football Widget (`football-widget.tsx`)

- **Current Status**: Uses custom `Card` components
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show today's matches count only
  - Implement standard mode (3x3+): Show full match list + standings
  - Hide title/icon in compact mode

### 6. Sports Widget (`sports-widget.tsx`)

- **Current Status**: Uses custom `Card` components (wrapper for F1/Football)
- **Needs**:
  - Migrate to `WidgetLayout`
  - Add `gridSize` prop support
  - Implement compact mode (≤2x2): Show active tab indicator only
  - Implement standard mode (3x3+): Show tabs + full content
  - Hide title/icon in compact mode

## 📝 Revamp Checklist

For each widget, follow this checklist:

- [ ] Import `WidgetLayout` from `@/components/dashboard/widget-layout`
- [ ] Add `gridSize` prop to component (extends `BaseWidgetProps`)
- [ ] Determine compact mode: `const isCompact = gridSize ? (gridSize.w <= 2 && gridSize.h <= 2) : false;`
- [ ] Replace `Card`/`CardHeader`/`CardContent` with `WidgetLayout`
- [ ] Conditionally hide title/icon in compact mode: `title={isCompact ? undefined : "Widget Name"}`
- [ ] Implement compact layout (single key metric/value)
- [ ] Implement standard layout (full content)
- [ ] Update widget registry `minW`/`minH` to allow 1x1 if needed
- [ ] Test both compact and standard modes
- [ ] Ensure error states use `WidgetLayout`

## 🎨 Design Patterns

### Compact Mode Pattern

```typescript
const isCompact = gridSize ? gridSize.w <= 2 && gridSize.h <= 2 : false;

return (
  <WidgetLayout
    gridSize={gridSize}
    title={isCompact ? undefined : "Widget Name"}
    icon={isCompact ? undefined : <Icon className="h-4 w-4" />}
    headerActions={isStandard ? headerActions : undefined}
  >
    {isCompact ? (
      // Single key metric/value, large display
      <div>...</div>
    ) : (
      // Full content grid/list
      <div>...</div>
    )}
  </WidgetLayout>
);
```

### Standard Mode Pattern

- Show all available metrics/data
- Include header actions (links, buttons)
- Use grid/list layouts for multiple items
- Maintain responsive sizing

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A self-hosted personal dashboard built with Next.js 16, featuring 20+ widget components for weather, sports, media services, finance, and system monitoring. Configuration is YAML-based with Zod validation.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production (standalone output)
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Single test run with verbose output
npm run test:ui      # Tests with UI dashboard
npm run test:coverage # Tests with coverage report
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, standalone output)
- **React**: 19.2.0 with Server/Client component split
- **Styling**: TailwindCSS 4
- **Testing**: Vitest with happy-dom
- **Validation**: Zod for config schemas

### Directory Structure

```
src/
├── app/
│   ├── api/           # API routes (18+ endpoints for service integrations)
│   └── login/         # Auth page
├── components/
│   ├── dashboard/     # Widget components (20+)
│   │   └── shared/    # Shared widget UI (WidgetError, WidgetLoading, StatCard)
│   └── ui/            # Base UI components (Radix-based)
├── config/
│   ├── widgets.ts     # Widget registration using defineWidget()
│   ├── dashboard.ts   # Dashboard config assembly
│   └── defaults.ts    # Shared constants (REFRESH_INTERVALS)
├── hooks/
│   ├── use-widget-data.ts   # SWR data fetching hook
│   └── use-widget-layout.ts # Layout calculation hook
├── lib/
│   ├── widget-registry.ts  # Widget registry & defineWidget factory
│   ├── http-client.ts      # HttpClient with retries & circuit breaker
│   ├── cache.ts            # In-memory cache with TTL
│   ├── api-handler.ts      # API error handling middleware
│   ├── config.ts           # YAML config loader
│   └── config-validation.ts # Zod validation schemas
├── types/
│   └── index.ts       # TypeScript type definitions
└── test/
    └── setup.ts       # Vitest setup (mocks Next.js)
```

### Key Patterns

**Widget Registry** (`src/lib/widget-registry.ts`): Central registry with `defineWidget()` factory for reduced boilerplate:

```typescript
defineWidget<ImmichWidgetProps, ImmichWidgetConfig>({
  type: "immich",
  component: ImmichWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      apiKey: cfg.api_key,
      refreshInterval: REFRESH_INTERVALS.CALENDAR,
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 4, y: 4, id: "immich" },
});
```

The factory auto-generates:
- `isEnabled()` from `widgetConfig.enabled`
- `configKey` derivation from widget type (kebab-case → snake_case)

**Shared Widget Infrastructure**:
- `useWidgetData<T>(options)` - SWR wrapper for data fetching
- `useWidgetLayout(gridSize)` - Returns `{ isMinimal, isCompact, isStandard }`
- `<WidgetError message="..." hint="..." />` - Standardized error display
- `<WidgetLoading message="..." />` - Standardized loading spinner
- `<StatCard icon={} label="" value={} loading={} />` - Reusable stat display

**Refresh Intervals** (`src/config/defaults.ts`):
```typescript
REFRESH_INTERVALS.REAL_TIME  // 1s (qbittorrent, cameras)
REFRESH_INTERVALS.FAST       // 30s (navidrome)
REFRESH_INTERVALS.STANDARD   // 60s (service-monitor, football)
REFRESH_INTERVALS.SLOW       // 5min (jellyfin, ghostfolio)
REFRESH_INTERVALS.CALENDAR   // 15min
REFRESH_INTERVALS.WEATHER    // 30min
```

**API Route Pattern**: All routes use `withErrorHandling()` middleware:
```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  const config = requireConfig(getFirstEnabledWidgetConfig(...), "...");
  const data = await cached(`key`, async () => { /* fetch */ }, 300000);
  return NextResponse.json(data);
});
```

**HttpClient** (`src/lib/http-client.ts`): Features retry with exponential backoff, circuit breaker (5 failures = open, 60s reset), and configurable timeouts.

**Caching** (`src/lib/cache.ts`): Use `cached(key, fn, ttl)` helper for async operations with TTL-based caching.

### Configuration

- Config file: `config.yaml` (or custom path via `CONFIG_FILE` env var)
- Example: `config.example.yaml`
- Validated with Zod schemas in `src/lib/config-validation.ts`
- Key sections: `page`, `server`, `spotlight`, `theme`, `widgets`

### Adding a New Widget

1. Create component in `src/components/dashboard/` using shared hooks:
   ```typescript
   const { data, error, isLoading } = useWidgetData<MyData>({
     endpoint: "/api/my-widget",
     refreshInterval: REFRESH_INTERVALS.STANDARD,
   });
   const { isCompact, isStandard } = useWidgetLayout(gridSize);
   ```
2. Register in `src/config/widgets.ts` using `defineWidget()`
3. Add config types to `src/lib/config.ts`
4. Add props types to `src/types/index.ts`
5. Add Zod schema to `src/lib/config-validation.ts`
6. Create API route in `src/app/api/` if needed

### Authentication

- Passphrase-based auth with encrypted session cookies
- Middleware in `src/proxy.ts` protects routes except `/login` and public assets
- Session encryption using crypto-js (`src/lib/auth.ts`)

## Testing

- Test files: `*.test.ts` or `*.test.tsx` in `src/`
- Setup mocks Next.js modules in `src/test/setup.ts`
- MSW available for API mocking

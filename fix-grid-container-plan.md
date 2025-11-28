# Grid Container & Alignment Fix Plan

The user has identified that the grid container is not spanning the full viewport width, causing a "dead zone" on the right side. Additionally, the `GridSkeleton` is misaligned because it is rendered separately from the main grid container.

## 1. Root Cause Analysis
- **Structure Issue:** `DashboardGrid` currently returns *either* `<GridSkeleton />` *or* the main grid wrapper. This means the Skeleton doesn't live in the same CSS context (the `containerRef` div) as the live grid, leading to layout shifts when hydration completes.
- **Width Issue:** If the container itself isn't explicitly forced to `width: 100%` (`w-full`), flexbox behavior or intrinsic sizing might be constraining it, especially if RGL's calculated width (in pixels) slightly differs from the browser's fluid layout.

## 2. Remediation Plan

### A. Unify Component Structure
Refactor `DashboardGrid.tsx` to:
1.  Always render the outer `div` with `ref={containerRef}` and `w-full`.
2.  Conditionally render `GridSkeleton` *inside* this container when `!mounted`.
3.  This ensures both states share the exact same parent dimensions and padding context.

### B. Enforce Full Width
- Update `src/app/page.tsx`: Ensure `<main>` has `w-full` and `max-w-full` to prevent unintended constraints.
- Update `DashboardGrid`: Ensure all wrapper divs have `w-full`.

### C. Synchronize Padding & Margins
- Verify `GridSkeleton` uses the exact same `CONTAINER_PADDING` constant as the live grid.
- Since `GridBackground` now uses CSS Grid, ensure `GridSkeleton` uses the *exact same* CSS Grid definition (`grid-template-columns`, `gap`, `padding`) so they overlay perfectly.

## 3. Implementation Steps

- [ ] **Step 1: Page Layout:** Update `page.tsx` to explicitly force full width on the main container.
- [ ] **Step 2: DashboardGrid Refactor:** Move the `containerRef` wrapper to be the root element returned by the component. Render `GridSkeleton` as a child of this wrapper when loading.
- [ ] **Step 3: Skeleton Alignment:** Update `GridSkeleton` props to accept `padding` and ensure its CSS matches `GridBackground` 1:1.

## 4. Verification
- Drag a widget to the far right edge (column 20).
- Refresh page: The Skeleton should appear *exactly* where the grid lines will be, with no layout jump.


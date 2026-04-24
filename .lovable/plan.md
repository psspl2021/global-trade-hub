# Consolidate SEO Cards → SEO Command Center

## Goal
Replace the 7 scattered SEO-related cards on the admin dashboard with **one** tabbed "SEO Command Center" card. All existing functionality is preserved — only the entry surface changes.

## Cards being merged

| Existing card | Lands in tab |
|---|---|
| SEO Dashboard | **Overview** |
| SEO Monitor | **Performance** |
| Revenue Dashboard | **Revenue → Live** |
| SEO Revenue | **Revenue → Attribution** |
| SEO Intelligence | **Intelligence → Keywords** |
| Demand Gaps | **Intelligence → Gaps** |
| SEO Pipeline | **Pipeline** |

Cards staying as-is (not SEO-overlapping): FX Rates Console, Blog Pipeline, Nudge Intelligence, Blog Management.

## New layout

```text
┌──────────────────────────────────────────────────────────┐
│  🌐 SEO Command Center                       [Unified]   │
│  All SEO surfaces in one place                           │
├──────────────────────────────────────────────────────────┤
│ [Overview] [Performance] [Revenue] [Intelligence] [Pipeline] │
│                                                          │
│  <active sub-view renders here, lazy-loaded>             │
└──────────────────────────────────────────────────────────┘
```

Revenue and Intelligence tabs each have a small inner sub-tab strip so no functionality is hidden behind a separate route.

## Files

**Create** `src/components/admin/SEOCommandCenter.tsx`
- Tabs UI with 5 top-level tabs + sub-tabs for Revenue & Intelligence
- Lazy-loads the existing components (SEODashboard, AdminSEOMonitor, RevenueDashboardView, SeoRevenueDashboard, AdminIntelligenceDashboard, DemandGapsPanel, SEOPipelinePanel) so first paint stays fast
- Each tab keeps the original short description for context

**Edit** `src/pages/governance/AdminAuditDashboard.tsx`
- Add `'seo-command'` to the `AdminView` union; remove the now-unused per-surface keys (`seo-revenue`, `seo-monitor`, `seo-rev-dashboard`, `seo-intelligence`, `seo-dashboard`, `demand-gaps`, `seo-pipeline`)
- Lazy-import `SEOCommandCenter` and route the new view to it in `renderView()`
- Drop the standalone module-level lazy imports for the 7 sub-components (now owned by `SEOCommandCenter`)
- In the dashboard grid: delete the "Revenue Dashboard" card from Row 8b (becomes single-column with just Nudge Intelligence), delete the entire "Row SEO" 4-card grid except FX Rates, delete the entire 4-card Blog/SEO/Demand grid except Blog Pipeline
- Insert one new full-width card linking to `setCurrentView('seo-command')`
- Keep FX Rates Console and Blog Pipeline as separate cards in a tidy 2-column row

## Result

- **Before:** 7 SEO cards spread across 3 grid rows
- **After:** 1 SEO Command Center card + FX Rates + Blog Pipeline (cleaner 3-card row)
- Zero loss of functionality, all existing pages reachable via tabs
- Lazy-loading preserves the current bundle-split behaviour

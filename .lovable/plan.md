

## Plan: Data Freshness Robustness + Color Coding

### Changes

**1. `src/hooks/useMarketIntelligence.ts`** — Replace `data[0]?.created_at` with a `reduce` to find the true latest `created_at`, making the freshness calculation independent of query ordering.

**2. `src/components/reverse-auction/MarketIntelligenceCard.tsx`** — Add color-coded freshness text: green (≤7 days), amber (≤30 days), red (>30 days), muted (unknown).

### Technical Detail

Hook change:
```ts
const latest = data?.reduce((max: string | null, row: any) => {
  if (!row.created_at) return max;
  return !max || new Date(row.created_at) > new Date(max) ? row.created_at : max;
}, null);
```

UI freshness color:
```ts
const freshnessColor = daysAgo == null ? "text-muted-foreground"
  : daysAgo <= 7 ? "text-emerald-600"
  : daysAgo <= 30 ? "text-amber-600"
  : "text-destructive";
```

Two files edited, no new files, no schema changes.


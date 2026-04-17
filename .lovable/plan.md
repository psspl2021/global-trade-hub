# CEO Control Layer — Implementation Plan

## Design principles
- **Override, never bypass.** Every elevated action is explicit, reasoned, and audited.
- **Capabilities, not role checks.** No `if role === 'ceo'` scattered in code.
- **Audit is non-optional.** Sensitive views and overrides write a ledger entry.
- **UI separation.** Supervisory layer lives under `/governance/ceo`, not mixed into operational screens.

---

## Phase 1 — Backend foundation (capabilities + audit)

### 1.1 `role_capabilities` table
Editable role→capability mapping (not hardcoded). Columns: `role`, `capability`, `granted` (default true), unique `(role, capability)`.

Seed CEO with: `can_view_all_auctions`, `can_view_all_quotes`, `can_override_po_approval`, `can_view_full_supplier_identity`, `can_view_all_pos`.

RLS: read for authenticated, writes via admin only.

### 1.2 `has_capability(user_id, capability)` RPC
SECURITY DEFINER. Resolves user's role via `user_company_access`, joins `role_capabilities`. Single source of truth for all permission checks.

### 1.3 `governance_audit_log` table
Columns: `actor_id`, `actor_role`, `action` (`override_po`, `view_auction_live`, `view_quotes_full`, `view_po_full`), `entity_type`, `entity_id`, `reason`, `metadata`, `created_at`.
RLS: insert via SECURITY DEFINER RPCs only; read for admins + the actor.

### 1.4 `log_governance_action(...)` RPC
Wrapper called by every elevated RPC below.

---

## Phase 2 — PO Override Flow (highest priority)

### 2.1 Schema
- `purchase_orders.approval_state` enum: `draft → manager_approved → ceo_override_approved → manager_acknowledged → finalized`
- New columns: `override_by`, `override_reason`, `override_at`, `manager_ack_by`, `manager_ack_at`.

### 2.2 RPC `ceo_override_approve_po(po_id, reason)`
Requires `can_override_po_approval`. Reason mandatory (≥10 chars). Sets state → `ceo_override_approved`. Writes audit log + manager notification.

### 2.3 RPC `manager_acknowledge_override(po_id)`
Manager moves state → `manager_acknowledged → finalized`. Writes audit log.

### 2.4 UI
- **CEO PO list** (`/governance/ceo/purchase-orders`): "Override & Approve" button → modal with mandatory reason.
- **Manager queue**: overridden POs show yellow banner "⚠ Approved by CEO override — acknowledge required" + ack button.
- PO detail badge: `Approved by CEO override (manager pending)` until acknowledged.

---

## Phase 3 — Reverse Auction Leaderboard (live, audited)

### 3.1 RPC `get_ceo_auction_leaderboard(auction_id)`
Requires `can_view_all_auctions`. Returns supplier name, rank, bid_price, bid_time, delta vs L1. Read-only. Writes one audit entry per session per auction (debounced).

### 3.2 UI `/governance/ceo/auctions`
List + drill-in (full leaderboard, savings vs baseline, spread chart). Banner: "Executive View — read-only, this access is logged". No bid controls.

---

## Phase 4 — Forward RFQ Full Visibility

### 4.1 RPC `get_ceo_rfq_quotes(requirement_id)`
Requires `can_view_all_quotes`. Returns all supplier quotes un-masked, variance, selection justification, linked PO id. Audited.

### 4.2 UI `/governance/ceo/rfq`
Company-wide RFQ list. Detail: supplier-wise quote table, variance chart, awarded supplier highlight, "View Linked PO" link.

---

## Phase 5 — Routes, navigation, scoped queries

### 5.1 Routes
- `/governance/ceo` — landing (existing CEO Insights stays).
- `/governance/ceo/auctions`, `/governance/ceo/rfq`, `/governance/ceo/purchase-orders`, `/governance/ceo/audit-log`.
All gated by `has_capability` (client nav + server RPC).

### 5.2 Extend `get_scoped_purchase_orders`
If caller has `can_view_all_pos`, return company-wide rows. No supplier masking when `can_view_full_supplier_identity`.

### 5.3 Frontend hooks
- `useCapabilities()` — fetch caller's capability set once, cached.
- `<RequireCapability cap="..." />` guard component.

---

## Phase 6 — Guardrails & polish
- Override modal: reason field with char counter + confirm dialog.
- Manager notification: in-app + notifications table entry.
- Audit log viewer: filterable by actor, action, entity, date range.
- Empty/loading states.

---

## Out of scope (this pass)
- Email/SMS notifications (in-app only).
- Per-user capability overrides (table supports it later).
- Multi-CEO approval quorum.

---

## Sequence
1. Phase 1 (foundation) — must land first.
2. Phase 2 (PO override) — highest-priority capability.
3. Phase 5.1+5.3 (routes + hooks) — required before 3/4 UI.
4. Phase 3 (auctions).
5. Phase 4 (RFQ).
6. Phase 6 (guardrails).

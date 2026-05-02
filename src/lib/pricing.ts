/**
 * Pure pricing predicates — extracted for testability.
 * Single source of truth for accidental-truncation detection.
 *
 * Used by:
 *   - SetupReverseAuction.tsx (client blur guard)
 *   - Future: server-side edge function validation
 */

/**
 * Detect accidental truncation between a snapshot value and the next value.
 * Uses log10 magnitude (base-agnostic, mathematically stable).
 * Epsilon guards against floating-point flicker at exact powers of 10.
 *
 * Triggers when next is at least 2 orders of magnitude smaller than snap
 * (e.g. 65,000 → 65 = drop of 3 orders → blocked;
 *       65,000 → 5,000 = drop of 1 order → allowed).
 *
 * Returns false for any non-finite or non-positive input (defensive).
 */
export function isAccidentalTruncation(snap: number, next: number): boolean {
  if (!Number.isFinite(snap) || !Number.isFinite(next)) return false;
  if (snap <= 0 || next <= 0) return false;
  const snapMag = Math.floor(Math.log10(snap + 1e-9));
  const nextMag = Math.floor(Math.log10(next + 1e-9));
  return snapMag - nextMag >= 2;
}

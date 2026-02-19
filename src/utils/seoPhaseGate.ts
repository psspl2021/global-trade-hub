export function canExpandToPhase2(
  indexedCount: number,
  warningCount: number,
  criticalCount: number = 0
): boolean {
  return indexedCount >= 10 && warningCount === 0 && criticalCount === 0;
}

export function canExpandToPhase2(indexedCount: number, warningCount: number): boolean {
  return indexedCount >= 10 && warningCount === 0;
}

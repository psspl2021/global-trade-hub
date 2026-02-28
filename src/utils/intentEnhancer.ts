/**
 * Wraps page intro with intent-boosting lead text for SEO authority signals.
 */
export function enhanceIntent(title: string, intro: string): string {
  return `<strong>${title}</strong> is one of the most searched procurement queries among EPC contractors and industrial buyers in India. ${intro} This guide provides grade-level comparison, cost implication, compliance standards, and sourcing intelligence for bulk steel buyers.`;
}

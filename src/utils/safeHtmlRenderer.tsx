import DOMPurify from 'dompurify';

/**
 * Safely renders text that may contain <a> tags.
 * Only allows anchor tags through DOMPurify; all other HTML is stripped.
 * Enforces rel="noopener noreferrer" on all links.
 */
export function renderSafeAnswer(answer: string): JSX.Element {
  const clean = DOMPurify.sanitize(answer, {
    ALLOWED_TAGS: ['a', 'strong', 'em'],
    ALLOWED_ATTR: ['href'],
  });

  const withSafeLinks = clean.replace(
    /<a /g,
    '<a target="_self" rel="noopener noreferrer" '
  );

  return (
    <span dangerouslySetInnerHTML={{ __html: withSafeLinks }} />
  );
}

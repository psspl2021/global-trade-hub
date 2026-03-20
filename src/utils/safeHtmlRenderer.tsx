import DOMPurify from 'dompurify';

/**
 * Safely renders text that may contain <a> tags.
 * Only allows anchor tags through DOMPurify; all other HTML is stripped.
 */
export function renderSafeAnswer(answer: string): JSX.Element {
  const clean = DOMPurify.sanitize(answer, {
    ALLOWED_TAGS: ['a', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'class'],
  });

  return (
    <span dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

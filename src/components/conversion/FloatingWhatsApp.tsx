/**
 * Floating WhatsApp button — sticky bottom-right on all public pages.
 * Excluded from auth/admin/dashboard routes.
 */
import { useLocation } from 'react-router-dom';
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/whatsapp';
import { trackEvent } from '@/lib/analytics';

const EXCLUDED = [
  '/admin',
  '/dashboard',
  '/management',
  '/control-tower',
  '/login',
  '/signup',
  '/reset-password',
  '/onboarding',
  '/governance',
];

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  if (EXCLUDED.some((r) => pathname.startsWith(r))) return null;

  return (
    <a
      href={buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click', { source: 'floating', page: pathname })}
      aria-label="Chat with ProcureSaathi on WhatsApp"
      className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-[#25D366]/20 hover:scale-110 hover:shadow-2xl transition-all"
    >
      {/* WhatsApp glyph */}
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.58-1.72a12.76 12.76 0 0 0 6.22 1.6h.01c7.06 0 12.79-5.73 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05A12.72 12.72 0 0 0 16 3.2zm0 23.32a10.5 10.5 0 0 1-5.36-1.47l-.38-.23-3.9 1.02 1.04-3.8-.25-.39a10.55 10.55 0 0 1-1.62-5.65c0-5.84 4.75-10.6 10.59-10.6 2.83 0 5.49 1.1 7.49 3.1a10.55 10.55 0 0 1 3.1 7.5c0 5.84-4.76 10.6-10.6 10.6zm5.81-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.4-.01-.61-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z"/>
      </svg>
    </a>
  );
}

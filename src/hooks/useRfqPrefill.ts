/**
 * useRfqPrefill — Smart prefill for the AI RFQ form.
 *
 * Sources (priority):
 *  1. Last submitted requirement (delivery_location, payment_terms)
 *  2. Buyer profile (city/state, company_name, phone, country)
 *  3. IP geo fallback (Cloudflare cdn-cgi/trace) for location only
 *
 * All fields are returned with a `source` label so the UI can show
 * "from last RFQ" / "from profile" / "detected" — building trust.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PrefillSource = 'last_rfq' | 'profile' | 'geo' | 'default' | 'none';

export interface PrefilledField<T = string> {
  value: T;
  source: PrefillSource;
}

export interface RfqPrefillData {
  location: PrefilledField<string>;
  paymentTerms: PrefilledField<string>;
  companyName: PrefilledField<string>;
  phone: PrefilledField<string>;
  loading: boolean;
}

const sourceLabels: Record<PrefillSource, string> = {
  last_rfq: 'from last RFQ',
  profile: 'from your profile',
  geo: 'detected',
  default: 'default — editable',
  none: '',
};

export function getSourceLabel(s: PrefillSource): string {
  return sourceLabels[s];
}

const DEFAULT_PAYMENT = 'Net 30 days';

async function detectGeoCity(): Promise<string | null> {
  try {
    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    const txt = await res.text();
    const cityLine = txt.split('\n').find(l => l.startsWith('loc='));
    // cdn-cgi/trace returns country code; we don't have city. Skip if no city.
    // If a city is needed later, swap to a richer geo provider. For now, return null.
    if (!cityLine) return null;
    return null;
  } catch {
    return null;
  }
}

export function useRfqPrefill(userId: string | null | undefined): RfqPrefillData {
  const [data, setData] = useState<RfqPrefillData>({
    location: { value: '', source: 'none' },
    paymentTerms: { value: DEFAULT_PAYMENT, source: 'default' },
    companyName: { value: '', source: 'none' },
    phone: { value: '', source: 'none' },
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setData(d => ({ ...d, loading: false }));
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Run profile + last-RFQ in parallel
      const [profileRes, lastReqRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('city, state, country, company_name, phone')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('requirements')
          .select('delivery_location, payment_terms, created_at')
          .eq('buyer_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const profile = profileRes.data;
      const lastReq = lastReqRes.data;

      // --- Location ---
      let location: PrefilledField<string> = { value: '', source: 'none' };
      if (lastReq?.delivery_location) {
        location = { value: lastReq.delivery_location, source: 'last_rfq' };
      } else if (profile?.city) {
        const parts = [profile.city, profile.state].filter(Boolean);
        location = { value: parts.join(', '), source: 'profile' };
      } else {
        // Geo fallback
        const geoCity = await detectGeoCity();
        if (cancelled) return;
        if (geoCity) location = { value: geoCity, source: 'geo' };
      }

      // --- Payment terms ---
      let paymentTerms: PrefilledField<string> = { value: DEFAULT_PAYMENT, source: 'default' };
      if (lastReq?.payment_terms) {
        paymentTerms = { value: lastReq.payment_terms, source: 'last_rfq' };
      }

      // --- Company / phone ---
      const companyName: PrefilledField<string> = profile?.company_name
        ? { value: profile.company_name, source: 'profile' }
        : { value: '', source: 'none' };
      const phone: PrefilledField<string> = profile?.phone
        ? { value: profile.phone, source: 'profile' }
        : { value: '', source: 'none' };

      setData({ location, paymentTerms, companyName, phone, loading: false });
    };

    run();
    return () => { cancelled = true; };
  }, [userId]);

  return data;
}

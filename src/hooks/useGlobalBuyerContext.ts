/**
 * ============================================================
 * GLOBAL BUYER CONTEXT HOOK
 * ============================================================
 * 
 * Provides region-aware context for buyer dashboards:
 * - Base currency & FX formatting
 * - Timezone (org_timezone)
 * - Region type (domestic/international)
 * - Compliance fields (Incoterms, tax ID type)
 * - Company metadata
 * 
 * Source of truth: buyer_companies + buyer_company_members
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GlobalBuyerContext {
  companyId: string | null;
  companyName: string | null;
  baseCurrency: string;
  regionType: 'domestic' | 'international';
  orgTimezone: string;
  country: string | null;
  industry: string | null;
  gstin: string | null;
  erpSyncPolicy: string;
  memberRole: string | null;
  isGlobal: boolean;
  isLoading: boolean;
  formatAmount: (val: number, overrideCurrency?: string) => string;
  formatCompact: (val: number, overrideCurrency?: string) => string;
  taxIdLabel: string;
  complianceFields: {
    requiresIncoterms: boolean;
    requiresHSCode: boolean;
    requiresExportDocs: boolean;
    taxType: string;
  };
  refetch: () => Promise<void>;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼',
  JPY: '¥', CNY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
  MYR: 'RM', THB: '฿', KRW: '₩', BRL: 'R$', ZAR: 'R', TRY: '₺',
};

const LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  AED: 'ar-AE', SAR: 'ar-SA', JPY: 'ja-JP', CNY: 'zh-CN',
  SGD: 'en-SG', AUD: 'en-AU', CAD: 'en-CA', CHF: 'de-CH',
};

export function useGlobalBuyerContext(): GlobalBuyerContext {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [regionType, setRegionType] = useState<'domestic' | 'international'>('domestic');
  const [orgTimezone, setOrgTimezone] = useState('Asia/Kolkata');
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [gstin, setGstin] = useState<string | null>(null);
  const [erpSyncPolicy, setErpSyncPolicy] = useState('manual');
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch membership + company in one join
      const { data: membership, error } = await supabase
        .from('buyer_company_members')
        .select(`
          role,
          company_id,
          buyer_companies (
            id, company_name, base_currency, country, industry,
            gstin, org_timezone, region_type, erp_sync_policy
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!error && membership) {
        const company = (membership as any).buyer_companies;
        setCompanyId(membership.company_id);
        setMemberRole(membership.role);
        
        if (company) {
          setCompanyName(company.company_name);
          setBaseCurrency(company.base_currency || 'INR');
          setRegionType(company.region_type === 'international' ? 'international' : 'domestic');
          setOrgTimezone(company.org_timezone || 'Asia/Kolkata');
          setCountry(company.country);
          setIndustry(company.industry);
          setGstin(company.gstin);
          setErpSyncPolicy(company.erp_sync_policy || 'manual');
        }
      }
    } catch (err) {
      console.error('[useGlobalBuyerContext] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const isGlobal = baseCurrency !== 'INR' || regionType === 'international';

  const formatAmount = useCallback((val: number, overrideCurrency?: string) => {
    const currency = overrideCurrency || baseCurrency;
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const locale = LOCALE_MAP[currency] || 'en-US';

    if (currency === 'INR') {
      if (val >= 10000000) return `${sym}${(val / 10000000).toFixed(1)} Cr`;
      if (val >= 100000) return `${sym}${(val / 100000).toFixed(1)} L`;
      if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
      return `${sym}${Math.round(val).toLocaleString('en-IN')}`;
    }
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency, maximumFractionDigits: 0,
      }).format(val);
    } catch {
      if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
      return `${sym}${Math.round(val).toLocaleString()}`;
    }
  }, [baseCurrency]);

  const formatCompact = useCallback((val: number, overrideCurrency?: string) => {
    const currency = overrideCurrency || baseCurrency;
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    if (currency === 'INR') {
      if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
      if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
      return Math.round(val).toLocaleString('en-IN');
    }
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return Math.round(val).toLocaleString();
  }, [baseCurrency]);

  const taxIdLabel = useMemo(() => {
    if (country === 'IN' || country === 'India') return 'GSTIN';
    if (country === 'US' || country === 'United States') return 'EIN / Tax ID';
    if (country === 'GB' || country === 'United Kingdom') return 'VAT Number';
    if (['AE', 'SA'].includes(country || '')) return 'TRN';
    return 'Tax ID';
  }, [country]);

  const complianceFields = useMemo(() => ({
    requiresIncoterms: regionType === 'international',
    requiresHSCode: regionType === 'international',
    requiresExportDocs: regionType === 'international',
    taxType: country === 'IN' || country === 'India' ? 'GST' :
      ['AE', 'SA'].includes(country || '') ? 'VAT' :
      country === 'US' || country === 'United States' ? 'Sales Tax' : 'VAT/Tax',
  }), [regionType, country]);

  return {
    companyId,
    companyName,
    baseCurrency,
    regionType,
    orgTimezone,
    country,
    industry,
    gstin,
    erpSyncPolicy,
    memberRole,
    isGlobal,
    isLoading,
    formatAmount,
    formatCompact,
    taxIdLabel,
    complianceFields,
    refetch: fetchContext,
  };
}

export default useGlobalBuyerContext;

/**
 * Region-based feature toggle hook
 * Controls visibility of global vs India-specific features
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RegionType = 'india' | 'global';

interface RegionFeatures {
  regionType: RegionType;
  isGlobal: boolean;
  isIndia: boolean;
  // Feature flags
  showMultiCurrency: boolean;
  showIncoterms: boolean;
  showExportDocs: boolean;
  showTimezoneConversion: boolean;
  showLanguageSwitcher: boolean;
  showGSTFields: boolean;
  showTaxIdFields: boolean;
  // User's settings
  userCurrency: string;
  userTimezone: string;
  userLanguage: string;
  userCountry: string;
  isLoading: boolean;
}

export function useRegionFeatures(): RegionFeatures {
  const { user } = useAuth();
  const [regionType, setRegionType] = useState<RegionType>('india');
  const [userCurrency, setUserCurrency] = useState('INR');
  const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
  const [userLanguage, setUserLanguage] = useState('en');
  const [userCountry, setUserCountry] = useState('india');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('region_type, country, timezone, language')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const rt = (data as any).region_type || 'india';
          setRegionType(rt);
          setUserCountry((data as any).country || 'india');
          setUserTimezone((data as any).timezone || 'Asia/Kolkata');
          setUserLanguage((data as any).language || 'en');
          
          // Auto-set currency from region
          if (rt === 'global') {
            // Will be overridden by profile currency if set
            setUserCurrency('USD');
          }
        }
      } catch (err) {
        console.error('[useRegionFeatures] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const isGlobal = regionType === 'global';
  const isIndia = regionType === 'india';

  return {
    regionType,
    isGlobal,
    isIndia,
    // Global users see these
    showMultiCurrency: isGlobal,
    showIncoterms: isGlobal,
    showExportDocs: isGlobal,
    showTimezoneConversion: isGlobal,
    showLanguageSwitcher: isGlobal,
    // India users see GST, global see Tax ID
    showGSTFields: isIndia,
    showTaxIdFields: isGlobal,
    // User settings
    userCurrency,
    userTimezone,
    userLanguage,
    userCountry,
    isLoading,
  };
}

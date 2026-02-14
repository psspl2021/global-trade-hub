/**
 * Hook to fetch countries from countries_master DB table.
 * Replaces hardcoded country arrays in admin dashboards.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CountryMasterRow {
  iso_code: string;
  country_name: string;
  region: string | null;
  is_active: boolean;
}

// Map ISO code to flag emoji
function isoToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const codePoints = [...code.toUpperCase()].map(
    char => 0x1F1E6 + char.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

export function useCountriesMaster() {
  const [countries, setCountries] = useState<CountryMasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('countries_master')
        .select('iso_code, country_name, region, is_active')
        .eq('is_active', true)
        .order('country_name');

      if (!error && data) {
        setCountries(data as CountryMasterRow[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const getFlag = (code: string) => isoToFlag(code);
  
  const getCountryName = (code: string) => {
    const c = countries.find(c => c.iso_code === code.toUpperCase());
    return c?.country_name || code;
  };

  const getCountriesByRegion = (region: string) => 
    countries.filter(c => c.region === region);

  const regions = [...new Set(countries.map(c => c.region).filter(Boolean))] as string[];

  return { countries, loading, getFlag, getCountryName, getCountriesByRegion, regions };
}

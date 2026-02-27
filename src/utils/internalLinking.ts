import { strategicCountriesData, type StrategicCountry } from "@/data/strategicCountries";

export function getCountryLinksForProduct(productSlug: string): StrategicCountry[] {
  return strategicCountriesData.filter(c =>
    c.relatedDemandSlugs.includes(productSlug)
  );
}

/**
 * ============================================================
 * RFQ DESTINATION SELECTOR
 * ============================================================
 * 
 * Smart destination country selector with:
 * - Domestic vs Import/Export toggle
 * - Auto-locked "India" for domestic
 * - Searchable, grouped multi-select for export
 * 
 * Data Storage: Comma-separated string in destination_country
 * - Domestic: "IN"
 * - Export single: "AE"
 * - Export multi: "AE,SA,QA"
 */

import { useState, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, ChevronDown, Search, MapPin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COUNTRY_REGIONS,
  getExportRegions,
  getCountryByCode,
  getCountryName,
  parseCountryString,
  toCountryString,
  type Country,
} from '@/config/countryConfig';

export type RFQType = 'domestic' | 'export';

interface RFQDestinationSelectorProps {
  value: string; // Comma-separated country codes
  onChange: (value: string) => void;
  rfqType: RFQType;
  onRFQTypeChange: (type: RFQType) => void;
  disabled?: boolean;
  maxCountries?: number;
  className?: string;
}

export function RFQDestinationSelector({
  value,
  onChange,
  rfqType,
  onRFQTypeChange,
  disabled = false,
  maxCountries = 10,
  className,
}: RFQDestinationSelectorProps) {
  // When switching to domestic, auto-set India
  const handleRFQTypeChange = (type: RFQType) => {
    onRFQTypeChange(type);
    if (type === 'domestic') {
      onChange('IN');
    } else {
      // Clear for fresh export selection
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* RFQ Type Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">RFQ Type</Label>
        <RadioGroup
          value={rfqType}
          onValueChange={(val) => handleRFQTypeChange(val as RFQType)}
          className="flex gap-4"
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domestic" id="rfq-domestic" />
            <Label htmlFor="rfq-domestic" className="cursor-pointer flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Domestic
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="export" id="rfq-export" />
            <Label htmlFor="rfq-export" className="cursor-pointer flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Import / Export
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Destination Country *</Label>
        
        {rfqType === 'domestic' ? (
          <DomesticDisplay />
        ) : (
          <ExportCountrySelector
            value={value}
            onChange={onChange}
            disabled={disabled}
            maxCountries={maxCountries}
          />
        )}
      </div>
    </div>
  );
}

// ============= DOMESTIC DISPLAY =============

function DomesticDisplay() {
  return (
    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <span className="text-xl">🇮🇳</span>
      <span className="font-medium">India</span>
      <Badge variant="secondary" className="ml-auto text-xs">
        Domestic
      </Badge>
    </div>
  );
}

// ============= EXPORT COUNTRY SELECTOR =============

interface ExportCountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  maxCountries: number;
}

function ExportCountrySelector({
  value,
  onChange,
  disabled,
  maxCountries,
}: ExportCountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCodes = useMemo(() => parseCountryString(value), [value]);
  
  const selectedCountries = useMemo(() => {
    return selectedCodes.map(code => getCountryByCode(code)).filter(Boolean) as Country[];
  }, [selectedCodes]);

  const exportRegions = useMemo(() => getExportRegions(), []);

  // Filter countries based on search
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return exportRegions;
    
    const query = searchQuery.toLowerCase();
    return exportRegions
      .map(({ key, config }) => ({
        key,
        config: {
          ...config,
          countries: config.countries.filter(
            c => c.name.toLowerCase().includes(query) || 
                 c.code.toLowerCase().includes(query)
          ),
        },
      }))
      .filter(r => r.config.countries.length > 0);
  }, [exportRegions, searchQuery]);

  const toggleCountry = useCallback((code: string) => {
    const codes = parseCountryString(value);
    if (codes.includes(code)) {
      onChange(toCountryString(codes.filter(c => c !== code)));
    } else if (codes.length < maxCountries) {
      onChange(toCountryString([...codes, code]));
    }
  }, [value, onChange, maxCountries]);

  const removeCountry = useCallback((code: string) => {
    const codes = parseCountryString(value);
    onChange(toCountryString(codes.filter(c => c !== code)));
  }, [value, onChange]);

  const clearAll = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Selected Countries Badges */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map((country) => (
            <Badge key={country.code} variant="secondary" className="gap-1 pr-1">
              <span>{country.name}</span>
              <button
                type="button"
                onClick={() => removeCountry(country.code)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCountries.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 text-xs text-muted-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Searchable Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selectedCountries.length > 0 ? (
              <span className="text-muted-foreground">
                {selectedCountries.length} countr{selectedCountries.length === 1 ? 'y' : 'ies'} selected
              </span>
            ) : (
              <span className="text-muted-foreground">Select destination countries...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
                autoFocus
              />
            </div>
          </div>

          {/* Country List */}
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredRegions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No countries found
                </div>
              ) : (
                filteredRegions.map(({ key, config }) => (
                  <div key={key} className="mb-2">
                    {/* Region Header */}
                    <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1.5 bg-muted/50 sticky top-0 font-medium">
                      {config.label}
                    </div>
                    
                    {/* Countries */}
                    {config.countries.map((country) => {
                      const isSelected = selectedCodes.includes(country.code);
                      const isDisabled = !isSelected && selectedCodes.length >= maxCountries;
                      
                      return (
                        <div
                          key={country.code}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer',
                            isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'
                          )}
                          onClick={() => !isDisabled && toggleCountry(country.code)}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            className="pointer-events-none"
                          />
                          <span className="flex-1">{country.name}</span>
                          <span className="text-xs text-muted-foreground">{country.code}</span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {selectedCodes.length >= maxCountries && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
              Maximum {maxCountries} countries allowed
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        {selectedCodes.length === 0 
          ? 'Select at least 1 destination country'
          : `${selectedCodes.length}/${maxCountries} countries selected`}
      </p>
    </div>
  );
}

export default RFQDestinationSelector;

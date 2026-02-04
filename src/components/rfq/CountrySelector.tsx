/**
 * ============================================================
 * COUNTRY SELECTOR COMPONENT
 * ============================================================
 * 
 * Region-grouped country dropdown for RFQ forms.
 * Supports single and multi-select modes.
 * 
 * Uses centralized countryMaster for data.
 */

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Globe, Check } from 'lucide-react';
import {
  countryMaster,
  getCountriesForRFQDropdown,
  getCountryByCode,
  getGlobalEntry,
  type CountryConfig,
  type Region,
} from '@/data/countryMaster';

interface SingleSelectProps {
  mode: 'single';
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showGlobalOption?: boolean;
  disabled?: boolean;
  className?: string;
}

interface MultiSelectProps {
  mode: 'multi';
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  showGlobalOption?: boolean;
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
}

type CountrySelectorProps = SingleSelectProps | MultiSelectProps;

export function CountrySelector(props: CountrySelectorProps) {
  const {
    mode,
    placeholder = 'Select country',
    showGlobalOption = false,
    disabled = false,
    className,
  } = props;

  const groupedCountries = useMemo(() => getCountriesForRFQDropdown(), []);

  if (mode === 'single') {
    return (
      <SingleCountrySelector
        {...(props as SingleSelectProps)}
        groupedCountries={groupedCountries}
        showGlobalOption={showGlobalOption}
      />
    );
  }

  return (
    <MultiCountrySelector
      {...(props as MultiSelectProps)}
      groupedCountries={groupedCountries}
      showGlobalOption={showGlobalOption}
    />
  );
}

// ============= SINGLE SELECT =============

interface SingleSelectorInternalProps extends SingleSelectProps {
  groupedCountries: ReturnType<typeof getCountriesForRFQDropdown>;
}

function SingleCountrySelector({
  value,
  onValueChange,
  placeholder,
  showGlobalOption,
  disabled,
  className,
  groupedCountries,
}: SingleSelectorInternalProps) {
  const selectedCountry = value ? getCountryByCode(value) : null;
  const globalEntry = getGlobalEntry();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : value === 'GLOBAL' ? (
            <span className="flex items-center gap-2">
              <span>{globalEntry.flag}</span>
              <span>{globalEntry.name}</span>
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[300px]">
          {showGlobalOption && (
            <SelectItem value="GLOBAL">
              <span className="flex items-center gap-2">
                <span>{globalEntry.flag}</span>
                <span className="font-medium">{globalEntry.name}</span>
              </span>
            </SelectItem>
          )}
          
          {groupedCountries.map((group) => (
            <SelectGroup key={group.region}>
              <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1.5 bg-muted/50">
                {group.regionName}
              </SelectLabel>
              {group.countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    {country.tradePriority === 'high' && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1 ml-auto">
                        Top
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

// ============= MULTI SELECT =============

interface MultiSelectorInternalProps extends MultiSelectProps {
  groupedCountries: ReturnType<typeof getCountriesForRFQDropdown>;
}

function MultiCountrySelector({
  value,
  onValueChange,
  placeholder,
  showGlobalOption,
  disabled,
  className,
  maxSelections = 10,
  groupedCountries,
}: MultiSelectorInternalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCountries = useMemo(() => {
    return value.map(code => getCountryByCode(code)).filter(Boolean) as CountryConfig[];
  }, [value]);

  const toggleCountry = (code: string) => {
    if (value.includes(code)) {
      onValueChange(value.filter(c => c !== code));
    } else if (value.length < maxSelections) {
      onValueChange([...value, code]);
    }
  };

  const removeCountry = (code: string) => {
    onValueChange(value.filter(c => c !== code));
  };

  const clearAll = () => {
    onValueChange([]);
  };

  return (
    <div className={className}>
      {/* Selected Countries Display */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedCountries.map((country) => (
            <Badge key={country.code} variant="secondary" className="gap-1 pr-1">
              <span>{country.flag}</span>
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

      {/* Dropdown */}
      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value=""
        onValueChange={() => {}}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue>
            {selectedCountries.length > 0 ? (
              <span className="text-muted-foreground">
                {selectedCountries.length} countr{selectedCountries.length === 1 ? 'y' : 'ies'} selected
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[300px]">
            {showGlobalOption && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => {
                  onValueChange(['GLOBAL']);
                  setIsOpen(false);
                }}
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">Worldwide (All Countries)</span>
              </div>
            )}

            {groupedCountries.map((group) => (
              <div key={group.region}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1.5 bg-muted/50 sticky top-0">
                  {group.regionName}
                </div>
                {group.countries.map((country) => {
                  const isSelected = value.includes(country.code);
                  const isDisabled = !isSelected && value.length >= maxSelections;
                  
                  return (
                    <div
                      key={country.code}
                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => !isDisabled && toggleCountry(country.code)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        className="pointer-events-none"
                      />
                      <span>{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      {country.tradePriority === 'high' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1">
                          Top
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </ScrollArea>
          
          {value.length >= maxSelections && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
              Maximum {maxSelections} countries selected
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CountrySelector;

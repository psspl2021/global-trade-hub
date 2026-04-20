/**
 * CountrySelector — Reusable country dropdown sourced from countries_master.
 * Reports back ISO code, country name, and the auto-resolved default currency.
 *
 * Use in signup, onboarding, supplier add, RFQ destination, etc.
 */
import { useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useCountriesMaster } from '@/hooks/useCountriesMaster';
import { getCurrencyForCountry } from '@/lib/currency';

interface CountrySelectorProps {
  value?: string; // country name OR iso
  onSelect: (info: {
    iso: string;
    name: string;
    currency: string;
    isIndia: boolean;
  }) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function CountrySelector({
  value,
  onSelect,
  label = 'Country',
  required,
  className,
  placeholder = 'Select country…',
}: CountrySelectorProps) {
  const { countries, loading } = useCountriesMaster();

  const selected = useMemo(() => {
    if (!value) return null;
    const v = value.toLowerCase();
    return (
      countries.find(
        (c) => c.iso_code.toLowerCase() === v || c.country_name.toLowerCase() === v
      ) || null
    );
  }, [value, countries]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={loading}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="truncate">
                {selected.country_name}{' '}
                <span className="text-muted-foreground text-xs">
                  ({selected.iso_code})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {loading ? 'Loading countries…' : placeholder}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((c) => {
                  const isSel = selected?.iso_code === c.iso_code;
                  return (
                    <CommandItem
                      key={c.iso_code}
                      value={`${c.country_name} ${c.iso_code}`}
                      onSelect={() => {
                        const currency = getCurrencyForCountry(c.iso_code);
                        const isIndia = c.iso_code.toUpperCase() === 'IN';
                        onSelect({
                          iso: c.iso_code,
                          name: c.country_name,
                          currency,
                          isIndia,
                        });
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSel ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 truncate">{c.country_name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {c.iso_code}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

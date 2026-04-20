import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { categoriesData } from '@/data/categories';
import { industries } from '@/data/industries';
import { CountrySelector } from '@/components/global/CountrySelector';
import { TaxIdField, isIndia, getTaxIdLabel } from '@/components/global/TaxIdField';
import { getCurrencyForCountry } from '@/lib/currency';

interface ProfileCompletionModalProps {
  userId: string | undefined;
  onComplete: () => void;
}

interface ProfileData {
  company_name: string;
  contact_person: string;
  phone: string;
  gstin: string;          // India tax ID
  tax_id: string;         // Global tax ID (VAT/EIN/TRN/etc.)
  country: string;        // ISO code or name (we store name for back-compat)
  country_iso: string;
  base_currency: string;
  city: string;
  state: string;
  address: string;
  supplier_categories: string[];
  buyer_industry: string;
}

const REQUIRED_FIELDS_BASE: (keyof ProfileData)[] = ['company_name', 'contact_person', 'phone', 'country', 'city', 'state', 'address'];

export const ProfileCompletionModal = ({ userId, onComplete }: ProfileCompletionModalProps) => {
  const [open, setOpen] = useState(false);
  const { role } = useUserRole(userId);
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    contact_person: '',
    phone: '',
    gstin: '',
    tax_id: '',
    country: 'India',
    country_iso: 'IN',
    base_currency: 'INR',
    city: '',
    state: '',
    address: '',
    supplier_categories: [],
    buyer_industry: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData | 'supplier_categories' | 'buyer_industry', string>>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const categoryNames = categoriesData.map(c => c.name);
  const indiaSelected = isIndia(profile.country);

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;

      const skippedKey = `profile_modal_skipped_${userId}`;
      if (sessionStorage.getItem(skippedKey)) {
        setLoading(false);
        onComplete();
        return;
      }

      const { data: membership } = await supabase
        .from('buyer_company_members')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (membership) {
        setLoading(false);
        onComplete();
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, contact_person, phone, gstin, tax_id, country, city, state, address, is_test_account, supplier_categories, buyer_industry, region_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        onComplete();
        return;
      }

      if (data) {
        if ((data as any).is_test_account) {
          setLoading(false);
          onComplete();
          return;
        }

        const country = (data as any).country || 'India';
        setProfile({
          company_name: data.company_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          gstin: (data as any).gstin || '',
          tax_id: (data as any).tax_id || '',
          country,
          country_iso: country.length === 2 ? country.toUpperCase() : (country.toLowerCase() === 'india' ? 'IN' : ''),
          base_currency: getCurrencyForCountry(country),
          city: data.city || '',
          state: data.state || '',
          address: data.address || '',
          supplier_categories: (data as any).supplier_categories || [],
          buyer_industry: (data as any).buyer_industry || '',
        });

        const isCountryIndia = isIndia(country);
        // India still needs GSTIN; global buyers/suppliers needn't have a tax_id to proceed.
        const requiredFields: (keyof ProfileData)[] = role === 'logistics_partner'
          ? REQUIRED_FIELDS_BASE
          : (isCountryIndia ? [...REQUIRED_FIELDS_BASE, 'gstin'] : REQUIRED_FIELDS_BASE);

        const missingFields = requiredFields.filter(field => {
          const value = (data as any)[field];
          return !value || (typeof value === 'string' && value.trim() === '');
        });

        if (missingFields.length > 0) {
          setOpen(true);
        } else {
          onComplete();
        }
      }
      setLoading(false);
    };

    checkProfile();
  }, [userId, onComplete, role]);

  const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};

    if (!profile.company_name?.trim()) newErrors.company_name = 'Company name is required';
    if (!profile.contact_person?.trim()) newErrors.contact_person = 'Contact person is required';
    if (!profile.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (indiaSelected && !/^[6-9]\d{9}$/.test(profile.phone)) {
      newErrors.phone = 'Invalid Indian phone (10 digits starting with 6-9)';
    } else if (!indiaSelected && !/^\+?[0-9\s\-()]{7,20}$/.test(profile.phone)) {
      newErrors.phone = 'Enter a valid phone number with country code';
    }
    if (!profile.country?.trim()) newErrors.country = 'Country is required';

    if (role !== 'logistics_partner' && indiaSelected) {
      if (!profile.gstin?.trim()) newErrors.gstin = 'GSTIN is required for Indian businesses';
      else if (!validateGSTIN(profile.gstin)) newErrors.gstin = 'Invalid GSTIN format';
    } else if (indiaSelected && profile.gstin?.trim() && !validateGSTIN(profile.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (!profile.city?.trim()) newErrors.city = 'City is required';
    if (!profile.state?.trim()) newErrors.state = indiaSelected ? 'State is required' : 'State / Region is required';
    if (!profile.address?.trim()) newErrors.address = 'Address is required';

    if (role === 'supplier' && profile.supplier_categories.length === 0) {
      newErrors.supplier_categories = 'Please select at least one supply category';
    }
    if (role === 'buyer' && !profile.buyer_industry?.trim()) {
      newErrors.buyer_industry = 'Please select your industry';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Please fill all required fields',
        description: 'All fields marked with * are mandatory',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const region_type = indiaSelected ? 'india' : 'global';
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: profile.company_name.trim(),
        contact_person: profile.contact_person.trim(),
        phone: profile.phone.trim(),
        gstin: indiaSelected ? profile.gstin.trim().toUpperCase() : null,
        tax_id: !indiaSelected ? (profile.tax_id.trim() || null) : null,
        country: profile.country.trim(),
        region_type,
        city: profile.city.trim(),
        state: profile.state.trim(),
        address: profile.address.trim(),
        supplier_categories: profile.supplier_categories,
        buyer_industry: profile.buyer_industry || null,
      } as any)
      .eq('id', userId!);

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('phone')) {
          toast({ title: 'Phone number already registered', description: 'This phone number is already associated with another account.', variant: 'destructive' });
          setErrors(prev => ({ ...prev, phone: 'Phone number already in use' }));
        } else if (error.message.includes('email')) {
          toast({ title: 'Email already registered', description: 'This email is already associated with another account.', variant: 'destructive' });
        } else {
          toast({ title: 'Duplicate entry', description: 'This information is already registered with another account.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({
      title: 'Profile completed!',
      description: indiaSelected
        ? 'Your profile has been updated successfully.'
        : `Profile saved. Your default currency is ${profile.base_currency}.`,
    });
    setOpen(false);
    onComplete();
  };

  if (loading || !open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setOpen(false);
        onComplete();
      }
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Fill in your details for a better experience. You can skip this for now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
            <Input
              id="company_name"
              value={profile.company_name}
              onChange={(e) => {
                setProfile({ ...profile, company_name: e.target.value });
                if (errors.company_name) setErrors({ ...errors, company_name: '' });
              }}
              className={errors.company_name ? 'border-destructive animate-shake' : ''}
            />
            {errors.company_name && <p className="text-sm text-destructive mt-1">{errors.company_name}</p>}
          </div>

          <div>
            <Label htmlFor="contact_person">Contact Person <span className="text-destructive">*</span></Label>
            <Input
              id="contact_person"
              value={profile.contact_person}
              onChange={(e) => {
                setProfile({ ...profile, contact_person: e.target.value });
                if (errors.contact_person) setErrors({ ...errors, contact_person: '' });
              }}
              className={errors.contact_person ? 'border-destructive animate-shake' : ''}
            />
            {errors.contact_person && <p className="text-sm text-destructive mt-1">{errors.contact_person}</p>}
          </div>

          {/* Country selector — drives currency + tax-id field */}
          <CountrySelector
            value={profile.country_iso || profile.country}
            onSelect={(info) => {
              setProfile({
                ...profile,
                country: info.name,
                country_iso: info.iso,
                base_currency: info.currency,
                // clear cross-fields when switching region
                gstin: info.isIndia ? profile.gstin : '',
                tax_id: info.isIndia ? '' : profile.tax_id,
              });
              if (errors.country) setErrors({ ...errors, country: '' });
            }}
            label="Country"
            required
          />
          {errors.country && <p className="text-sm text-destructive mt-1">{errors.country}</p>}

          {!indiaSelected && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20 text-xs">
              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Default currency for your account: <strong>{profile.base_currency}</strong>.
                Prices will be shown in {profile.base_currency} (anchored to INR).
              </span>
            </div>
          )}

          <div>
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => {
                setProfile({ ...profile, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={errors.phone ? 'border-destructive animate-shake' : ''}
              placeholder={indiaSelected ? '10-digit mobile number' : '+1 555 123 4567'}
            />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
          </div>

          {/* Country-aware tax id */}
          {indiaSelected ? (
            <TaxIdField
              country="India"
              value={profile.gstin}
              onChange={(v) => {
                setProfile({ ...profile, gstin: v });
                if (errors.gstin) setErrors({ ...errors, gstin: '' });
              }}
              required={role !== 'logistics_partner'}
              id="gstin"
            />
          ) : (
            <TaxIdField
              country={profile.country}
              value={profile.tax_id}
              onChange={(v) => {
                setProfile({ ...profile, tax_id: v });
                if (errors.tax_id) setErrors({ ...errors, tax_id: '' });
              }}
              id="tax_id"
            />
          )}
          {errors.gstin && <p className="text-sm text-destructive mt-1">{errors.gstin}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => {
                  setProfile({ ...profile, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: '' });
                }}
                className={errors.city ? 'border-destructive animate-shake' : ''}
              />
              {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
            </div>
            <div>
              <Label htmlFor="state">{indiaSelected ? 'State' : 'State / Region'} <span className="text-destructive">*</span></Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => {
                  setProfile({ ...profile, state: e.target.value });
                  if (errors.state) setErrors({ ...errors, state: '' });
                }}
                className={errors.state ? 'border-destructive animate-shake' : ''}
              />
              {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Office Address <span className="text-destructive">*</span></Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => {
                setProfile({ ...profile, address: e.target.value });
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              className={errors.address ? 'border-destructive animate-shake' : ''}
            />
            {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
          </div>

          {role === 'supplier' && (
            <div>
              <Label>Supply Categories <span className="text-destructive">*</span></Label>
              <p className="text-sm text-muted-foreground mb-2">Select categories you supply raw materials in</p>
              <div className={`grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 ${errors.supplier_categories ? 'border-destructive' : ''}`}>
                {categoryNames.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={profile.supplier_categories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProfile({ ...profile, supplier_categories: [...profile.supplier_categories, category] });
                        } else {
                          setProfile({ ...profile, supplier_categories: profile.supplier_categories.filter(c => c !== category) });
                        }
                        if (errors.supplier_categories) setErrors({ ...errors, supplier_categories: '' });
                      }}
                    />
                    <label htmlFor={`cat-${category}`} className="text-sm cursor-pointer truncate">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              {errors.supplier_categories && <p className="text-sm text-destructive mt-1">{errors.supplier_categories}</p>}
            </div>
          )}

          {role === 'buyer' && (
            <div>
              <Label htmlFor="buyer_industry">Industry <span className="text-destructive">*</span></Label>
              <p className="text-sm text-muted-foreground mb-2">Select the industry you work in</p>
              <Select
                value={profile.buyer_industry}
                onValueChange={(value) => {
                  setProfile({ ...profile, buyer_industry: value });
                  if (errors.buyer_industry) setErrors({ ...errors, buyer_industry: '' });
                }}
              >
                <SelectTrigger className={errors.buyer_industry ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buyer_industry && <p className="text-sm text-destructive mt-1">{errors.buyer_industry}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (userId) {
                sessionStorage.setItem(`profile_modal_skipped_${userId}`, 'true');
              }
              setOpen(false);
              onComplete();
            }}
            className="flex-1"
          >
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save & Continue'}
            {!saving && <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

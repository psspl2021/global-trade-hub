import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { categoriesData } from '@/data/categories';
import { industries } from '@/data/industries';

interface ProfileCompletionModalProps {
  userId: string | undefined;
  onComplete: () => void;
}

interface ProfileData {
  company_name: string;
  contact_person: string;
  phone: string;
  gstin: string;
  city: string;
  state: string;
  address: string;
  supplier_categories: string[];
  buyer_industry: string;
}

const REQUIRED_FIELDS: (keyof ProfileData)[] = ['company_name', 'contact_person', 'phone', 'gstin', 'city', 'state', 'address'];

export const ProfileCompletionModal = ({ userId, onComplete }: ProfileCompletionModalProps) => {
  const [open, setOpen] = useState(false);
  const { role } = useUserRole(userId);
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    contact_person: '',
    phone: '',
    gstin: '',
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

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, contact_person, phone, gstin, city, state, address, is_test_account, supplier_categories, buyer_industry')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Skip validation for test accounts
        if (data.is_test_account) {
          setLoading(false);
          onComplete();
          return;
        }

        setProfile({
          company_name: data.company_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          gstin: data.gstin || '',
          city: data.city || '',
          state: data.state || '',
          address: data.address || '',
          supplier_categories: data.supplier_categories || [],
          buyer_industry: data.buyer_industry || '',
        });

        // Check if any required field is missing
        const missingFields = REQUIRED_FIELDS.filter(field => {
          const value = data[field as keyof typeof data];
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
  }, [userId, onComplete]);

  const validateGSTIN = (gstin: string): boolean => {
    if (!gstin) return false;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};

    if (!profile.company_name?.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    if (!profile.contact_person?.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }
    if (!profile.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(profile.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits starting with 6-9)';
    }
    if (!profile.gstin?.trim()) {
      newErrors.gstin = 'GSTIN is required';
    } else if (!validateGSTIN(profile.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }
    if (!profile.city?.trim()) {
      newErrors.city = 'City is required';
    }
    if (!profile.state?.trim()) {
      newErrors.state = 'State is required';
    }
    if (!profile.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    // Role-specific validations
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
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: profile.company_name.trim(),
        contact_person: profile.contact_person.trim(),
        phone: profile.phone.trim(),
        gstin: profile.gstin.trim().toUpperCase(),
        city: profile.city.trim(),
        state: profile.state.trim(),
        address: profile.address.trim(),
        supplier_categories: profile.supplier_categories,
        buyer_industry: profile.buyer_industry || null,
      })
      .eq('id', userId);

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('phone')) {
          toast({
            title: 'Phone number already registered',
            description: 'This phone number is already associated with another account.',
            variant: 'destructive',
          });
          setErrors(prev => ({ ...prev, phone: 'Phone number already in use' }));
        } else if (error.message.includes('email')) {
          toast({
            title: 'Email already registered',
            description: 'This email is already associated with another account.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Duplicate entry',
            description: 'This information is already registered with another account.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error saving profile',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: 'Profile completed!',
      description: 'Your profile has been updated successfully.',
    });
    setOpen(false);
    onComplete();
  };

  if (loading || !open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please fill in all mandatory details to continue using the platform.
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
              placeholder="10-digit mobile number"
            />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="gstin">GSTIN <span className="text-destructive">*</span></Label>
            <Input
              id="gstin"
              value={profile.gstin}
              onChange={(e) => {
                setProfile({ ...profile, gstin: e.target.value.toUpperCase() });
                if (errors.gstin) setErrors({ ...errors, gstin: '' });
              }}
              className={errors.gstin ? 'border-destructive animate-shake' : ''}
              placeholder="e.g., 22AAAAA0000A1Z5"
            />
            {errors.gstin && <p className="text-sm text-destructive mt-1">{errors.gstin}</p>}
          </div>

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
              <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
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

          {/* Supplier Categories - Only for suppliers */}
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

          {/* Buyer Industry - Only for buyers */}
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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save & Continue'}
          {!saving && <CheckCircle className="ml-2 h-4 w-4" />}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

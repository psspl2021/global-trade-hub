import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const ProfileSettings = ({ open, onOpenChange, userId }: ProfileSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    referred_by_name: '',
    referred_by_phone: '',
    city: '',
    state: '',
    gstin: '',
    address: '',
    yard_location: '',
  });

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('company_name, contact_person, phone, referred_by_name, referred_by_phone, city, state, gstin, address, yard_location')
      .eq('id', userId)
      .single();

    if (error) {
      toast.error('Failed to load profile');
    } else if (data) {
      setProfile({
        company_name: data.company_name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        referred_by_name: data.referred_by_name || '',
        referred_by_phone: data.referred_by_phone || '',
        city: data.city || '',
        state: data.state || '',
        gstin: data.gstin || '',
        address: data.address || '',
        yard_location: (data as any).yard_location || '',
      });
    }
    setLoading(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profile.gstin.trim()) {
      newErrors.gstin = 'GSTIN is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profile.gstin.trim())) {
      newErrors.gstin = 'Please enter a valid 15-character GSTIN';
    }
    
    if (!profile.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!profile.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!profile.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!profile.yard_location.trim()) {
      newErrors.yard_location = 'Yard Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: profile.company_name,
        contact_person: profile.contact_person,
        phone: profile.phone,
        referred_by_name: profile.referred_by_name || null,
        referred_by_phone: profile.referred_by_phone || null,
        city: profile.city,
        state: profile.state,
        gstin: profile.gstin,
        address: profile.address,
        yard_location: profile.yard_location,
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={profile.contact_person}
                onChange={(e) => setProfile({ ...profile, contact_person: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin" className="flex items-center gap-1">
                GSTIN <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gstin"
                value={profile.gstin}
                onChange={(e) => {
                  setProfile({ ...profile, gstin: e.target.value.toUpperCase() });
                  if (errors.gstin) setErrors({ ...errors, gstin: '' });
                }}
                className={errors.gstin ? 'border-destructive' : ''}
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
              {errors.gstin && <p className="text-sm text-destructive">{errors.gstin}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => {
                    setProfile({ ...profile, city: e.target.value });
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="flex items-center gap-1">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => {
                    setProfile({ ...profile, state: e.target.value });
                    if (errors.state) setErrors({ ...errors, state: '' });
                  }}
                  className={errors.state ? 'border-destructive' : ''}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => {
                  setProfile({ ...profile, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="yard_location" className="flex items-center gap-1">
                Yard Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="yard_location"
                value={profile.yard_location}
                onChange={(e) => {
                  setProfile({ ...profile, yard_location: e.target.value });
                  if (errors.yard_location) setErrors({ ...errors, yard_location: '' });
                }}
                className={errors.yard_location ? 'border-destructive' : ''}
                placeholder="Enter yard location"
              />
              {errors.yard_location && <p className="text-sm text-destructive">{errors.yard_location}</p>}
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Referred By</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referred_by_name">Name</Label>
                  <Input
                    id="referred_by_name"
                    value={profile.referred_by_name}
                    onChange={(e) => setProfile({ ...profile, referred_by_name: e.target.value })}
                    placeholder="Referrer's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referred_by_phone">Phone</Label>
                  <Input
                    id="referred_by_phone"
                    value={profile.referred_by_phone}
                    onChange={(e) => setProfile({ ...profile, referred_by_phone: e.target.value })}
                    placeholder="+919876543210"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
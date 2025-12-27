import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, ChevronRight, Mail, Bell } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { categoriesData } from '@/data/categories';
import { industries } from '@/data/industries';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const ProfileSettings = ({ open, onOpenChange, userId }: ProfileSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { role } = useUserRole(userId);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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
    supplier_categories: [] as string[],
    supplier_notification_subcategories: [] as string[],
    buyer_industry: '',
    email_notifications_enabled: true,
  });

  const categoryNames = categoriesData.map(c => c.name);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('company_name, contact_person, phone, referred_by_name, referred_by_phone, city, state, gstin, address, yard_location, supplier_categories, supplier_notification_subcategories, buyer_industry, email_notifications_enabled')
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
        supplier_categories: data.supplier_categories || [],
        supplier_notification_subcategories: (data as any).supplier_notification_subcategories || [],
        buyer_industry: data.buyer_industry || '',
        email_notifications_enabled: (data as any).email_notifications_enabled !== false,
      });
    }
    setLoading(false);
  };

  // Get subcategories for selected categories
  const availableSubcategories = useMemo(() => {
    const subcats: { category: string; subcategories: string[] }[] = [];
    profile.supplier_categories.forEach(catName => {
      const category = categoriesData.find(c => c.name === catName);
      if (category && category.subcategories.length > 0) {
        subcats.push({ category: catName, subcategories: category.subcategories });
      }
    });
    return subcats;
  }, [profile.supplier_categories]);

  const toggleCategoryExpand = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategory: string) => {
    setProfile(prev => {
      const isSelected = prev.supplier_notification_subcategories.includes(subcategory);
      return {
        ...prev,
        supplier_notification_subcategories: isSelected
          ? prev.supplier_notification_subcategories.filter(s => s !== subcategory)
          : [...prev.supplier_notification_subcategories, subcategory]
      };
    });
  };

  const selectAllSubcategories = (categoryName: string) => {
    const category = categoriesData.find(c => c.name === categoryName);
    if (!category) return;
    
    setProfile(prev => {
      const allSubcats = category.subcategories;
      const currentSelected = prev.supplier_notification_subcategories;
      const allSelected = allSubcats.every(sub => currentSelected.includes(sub));
      
      if (allSelected) {
        // Deselect all subcategories of this category
        return {
          ...prev,
          supplier_notification_subcategories: currentSelected.filter(s => !allSubcats.includes(s))
        };
      } else {
        // Select all subcategories of this category
        const newSelection = [...new Set([...currentSelected, ...allSubcats])];
        return {
          ...prev,
          supplier_notification_subcategories: newSelection
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profile.company_name.trim()) {
      newErrors.company_name = 'Company Name is required';
    }
    
    if (!profile.contact_person.trim()) {
      newErrors.contact_person = 'Contact Person is required';
    }
    
    if (!profile.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
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

    // Role-specific validations
    if (role === 'supplier' && profile.supplier_categories.length === 0) {
      newErrors.supplier_categories = 'Please select at least one supply category';
    }
    if (role === 'buyer' && !profile.buyer_industry.trim()) {
      newErrors.buyer_industry = 'Please select your industry';
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
        supplier_categories: profile.supplier_categories,
        supplier_notification_subcategories: profile.supplier_notification_subcategories,
        buyer_industry: profile.buyer_industry || null,
        email_notifications_enabled: profile.email_notifications_enabled,
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

  // Clean up subcategories when categories change
  useEffect(() => {
    const validSubcategories = new Set<string>();
    profile.supplier_categories.forEach(catName => {
      const category = categoriesData.find(c => c.name === catName);
      if (category) {
        category.subcategories.forEach(sub => validSubcategories.add(sub));
      }
    });
    
    // Remove any subcategories that are no longer valid
    const cleanedSubcategories = profile.supplier_notification_subcategories.filter(
      sub => validSubcategories.has(sub)
    );
    
    if (cleanedSubcategories.length !== profile.supplier_notification_subcategories.length) {
      setProfile(prev => ({
        ...prev,
        supplier_notification_subcategories: cleanedSubcategories
      }));
    }
  }, [profile.supplier_categories]);

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
              <Label htmlFor="company_name" className="flex items-center gap-1">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => {
                  setProfile({ ...profile, company_name: e.target.value });
                  if (errors.company_name) setErrors({ ...errors, company_name: '' });
                }}
                className={errors.company_name ? 'border-destructive animate-shake' : ''}
              />
              {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person" className="flex items-center gap-1">
                Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact_person"
                value={profile.contact_person}
                onChange={(e) => {
                  setProfile({ ...profile, contact_person: e.target.value });
                  if (errors.contact_person) setErrors({ ...errors, contact_person: '' });
                }}
                className={errors.contact_person ? 'border-destructive animate-shake' : ''}
              />
              {errors.contact_person && <p className="text-sm text-destructive">{errors.contact_person}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => {
                  setProfile({ ...profile, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={errors.phone ? 'border-destructive animate-shake' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
                className={errors.gstin ? 'border-destructive animate-shake' : ''}
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
                  className={errors.city ? 'border-destructive animate-shake' : ''}
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
                  className={errors.state ? 'border-destructive animate-shake' : ''}
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
                className={errors.address ? 'border-destructive animate-shake' : ''}
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
                className={errors.yard_location ? 'border-destructive animate-shake' : ''}
                placeholder="Enter yard location"
              />
              {errors.yard_location && <p className="text-sm text-destructive">{errors.yard_location}</p>}
            </div>

            {/* Supplier Categories - Only for suppliers */}
            {role === 'supplier' && (
              <div className="border-t pt-4 mt-4">
                <Label className="flex items-center gap-1 mb-2">Supply Categories <span className="text-destructive">*</span></Label>
                <p className="text-sm text-muted-foreground mb-3">Select categories you supply raw materials in</p>
                <div className={`grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 ${errors.supplier_categories ? 'border-destructive' : ''}`}>
                  {categoryNames.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`settings-cat-${category}`}
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
                      <label htmlFor={`settings-cat-${category}`} className="text-sm cursor-pointer truncate">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.supplier_categories && <p className="text-sm text-destructive mt-1">{errors.supplier_categories}</p>}
                
                {/* Email Notifications Section */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Email Notification Preferences</Label>
                  </div>
                  
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div>
                      <Label htmlFor="email_notifications" className="font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Enable Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails when new requirements match your preferences
                      </p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={profile.email_notifications_enabled}
                      onCheckedChange={(checked) => setProfile({ ...profile, email_notifications_enabled: checked })}
                    />
                  </div>

                  {/* Subcategory Selection - Only show when notifications are enabled and categories are selected */}
                  {profile.email_notifications_enabled && availableSubcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Select Subcategories for Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Choose specific product subcategories to receive targeted notifications
                      </p>
                      
                      {profile.supplier_notification_subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="text-xs text-muted-foreground">Selected:</span>
                          <Badge variant="secondary" className="text-xs">
                            {profile.supplier_notification_subcategories.length} subcategories
                          </Badge>
                        </div>
                      )}
                      
                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        {availableSubcategories.map(({ category, subcategories }) => {
                          const isExpanded = expandedCategories.has(category);
                          const selectedCount = subcategories.filter(
                            sub => profile.supplier_notification_subcategories.includes(sub)
                          ).length;
                          const allSelected = selectedCount === subcategories.length;
                          
                          return (
                            <Collapsible
                              key={category}
                              open={isExpanded}
                              onOpenChange={() => toggleCategoryExpand(category)}
                            >
                              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 border-b">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span className="text-sm font-medium">{category}</span>
                                  {selectedCount > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {selectedCount}/{subcategories.length}
                                    </Badge>
                                  )}
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pl-6 pr-2 py-2 bg-muted/20">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs mb-2 h-7"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    selectAllSubcategories(category);
                                  }}
                                >
                                  {allSelected ? 'Deselect All' : 'Select All'}
                                </Button>
                                <div className="grid gap-1">
                                  {subcategories.map((subcategory) => (
                                    <div key={subcategory} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`subcat-${subcategory}`}
                                        checked={profile.supplier_notification_subcategories.includes(subcategory)}
                                        onCheckedChange={() => toggleSubcategory(subcategory)}
                                      />
                                      <label
                                        htmlFor={`subcat-${subcategory}`}
                                        className="text-xs cursor-pointer"
                                      >
                                        {subcategory}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 If no subcategories are selected, you'll receive notifications for all products in your selected categories
                      </p>
                    </div>
                  )}
                  
                  {profile.email_notifications_enabled && profile.supplier_categories.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                      Select at least one category above to configure notification subcategories
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Buyer Industry - Only for buyers */}
            {role === 'buyer' && (
              <div className="border-t pt-4 mt-4">
                <Label htmlFor="buyer_industry" className="flex items-center gap-1 mb-2">Industry <span className="text-destructive">*</span></Label>
                <p className="text-sm text-muted-foreground mb-3">Select the industry you work in</p>
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
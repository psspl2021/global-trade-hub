import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface CompanyLogoUploadProps {
  userId: string;
  currentLogoUrl?: string | null;
  onLogoChange?: (url: string | null) => void;
}

export const CompanyLogoUpload = ({ userId, currentLogoUrl, onLogoChange }: CompanyLogoUploadProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLogoUrl(currentLogoUrl || null);
  }, [currentLogoUrl]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image size must be less than 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/logo.${fileExt}`;

      // Delete existing logo if any
      if (logoUrl) {
        const oldPath = logoUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('company-logos').remove([oldPath]);
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update profile with logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      onLogoChange?.(publicUrl);
      toast({ title: 'Success', description: 'Logo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!logoUrl) return;

    setUploading(true);
    try {
      const path = logoUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('company-logos').remove([path]);

      const { error } = await supabase
        .from('profiles')
        .update({ company_logo_url: null })
        .eq('id', userId);

      if (error) throw error;

      setLogoUrl(null);
      onLogoChange?.(null);
      toast({ title: 'Success', description: 'Logo removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Company Logo (for Invoices & POs)</Label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            {logoUrl ? 'Change' : 'Upload'}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              disabled={uploading}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground">Max 2MB, PNG/JPG recommended</p>
        </div>
      </div>
    </div>
  );
};

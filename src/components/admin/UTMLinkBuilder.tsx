import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface UTMLink {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
}

const commonSources = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const commonMediums = [
  { value: 'cpc', label: 'CPC (Paid Ads)' },
  { value: 'organic', label: 'Organic' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referral' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'display', label: 'Display' },
  { value: 'video', label: 'Video' },
];

export const UTMLinkBuilder = () => {
  const [baseUrl, setBaseUrl] = useState('https://procuresaathi.com');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [savedLinks, setSavedLinks] = useState<UTMLink[]>([]);

  const generateUrl = () => {
    if (!baseUrl || !utmSource || !utmMedium || !utmCampaign) {
      return '';
    }

    const params = new URLSearchParams();
    params.set('utm_source', utmSource);
    params.set('utm_medium', utmMedium);
    params.set('utm_campaign', utmCampaign);
    if (utmTerm) params.set('utm_term', utmTerm);
    if (utmContent) params.set('utm_content', utmContent);

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${params.toString()}`;
  };

  const generatedUrl = generateUrl();

  const copyToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast.success('URL copied to clipboard!');
    }
  };

  const saveLink = () => {
    if (!generatedUrl) {
      toast.error('Generate a URL first');
      return;
    }

    const newLink: UTMLink = {
      id: Date.now().toString(),
      name: utmCampaign || 'Untitled Campaign',
      url: generatedUrl,
      createdAt: new Date(),
    };

    setSavedLinks([newLink, ...savedLinks]);
    toast.success('Link saved!');
  };

  const deleteLink = (id: string) => {
    setSavedLinks(savedLinks.filter(link => link.id !== id));
    toast.success('Link deleted');
  };

  const clearForm = () => {
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">UTM Link Builder</h2>
        <p className="text-muted-foreground">Create trackable URLs for your marketing campaigns</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Builder Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Build Your Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL *</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://procuresaathi.com/browse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utmSource">Source *</Label>
                <Select value={utmSource} onValueChange={setUtmSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonSources.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type custom..."
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utmMedium">Medium *</Label>
                <Select value={utmMedium} onValueChange={setUtmMedium}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonMediums.map(medium => (
                      <SelectItem key={medium.value} value={medium.value}>
                        {medium.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type custom..."
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="utmCampaign">Campaign Name *</Label>
              <Input
                id="utmCampaign"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="e.g., dec_chemicals_promo, welcome_series"
              />
              <p className="text-xs text-muted-foreground">
                Use underscores instead of spaces. Keep it descriptive.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utmTerm">Term (Optional)</Label>
                <Input
                  id="utmTerm"
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="e.g., steel_suppliers"
                />
                <p className="text-xs text-muted-foreground">
                  For paid search keywords
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utmContent">Content (Optional)</Label>
                <Input
                  id="utmContent"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="e.g., header_cta, footer_link"
                />
                <p className="text-xs text-muted-foreground">
                  For A/B testing different links
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={clearForm} variant="outline" className="flex-1">
                Clear
              </Button>
              <Button onClick={saveLink} variant="secondary" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Save Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated URL */}
        <Card>
          <CardHeader>
            <CardTitle>Generated URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedUrl ? (
              <>
                <Textarea
                  value={generatedUrl}
                  readOnly
                  className="min-h-[100px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test
                    </a>
                  </Button>
                </div>

                {/* URL Breakdown */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">URL Parameters:</h4>
                  <div className="space-y-1">
                    <div className="flex gap-2 text-sm">
                      <Badge variant="outline">utm_source</Badge>
                      <span className="text-muted-foreground">{utmSource}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="outline">utm_medium</Badge>
                      <span className="text-muted-foreground">{utmMedium}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="outline">utm_campaign</Badge>
                      <span className="text-muted-foreground">{utmCampaign}</span>
                    </div>
                    {utmTerm && (
                      <div className="flex gap-2 text-sm">
                        <Badge variant="outline">utm_term</Badge>
                        <span className="text-muted-foreground">{utmTerm}</span>
                      </div>
                    )}
                    {utmContent && (
                      <div className="flex gap-2 text-sm">
                        <Badge variant="outline">utm_content</Badge>
                        <span className="text-muted-foreground">{utmContent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the required fields to generate your URL</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Links */}
      {savedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedLinks.map(link => (
                <div key={link.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(link.url);
                        toast.success('Copied!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">📧 Email Newsletter</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=newsletter<br/>
                utm_medium=email<br/>
                utm_campaign=weekly_digest
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">📱 Facebook Ad</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=facebook<br/>
                utm_medium=cpc<br/>
                utm_campaign=steel_promo
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">🔍 Google Search Ad</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=google<br/>
                utm_medium=cpc<br/>
                utm_campaign=b2b_suppliers<br/>
                utm_term=steel_suppliers_india
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">💬 WhatsApp Share</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=whatsapp<br/>
                utm_medium=social<br/>
                utm_campaign=referral
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">💼 LinkedIn Post</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=linkedin<br/>
                utm_medium=social<br/>
                utm_campaign=thought_leadership
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">🤝 Partner Link</h4>
              <code className="text-xs block bg-background p-2 rounded">
                utm_source=partner_name<br/>
                utm_medium=referral<br/>
                utm_campaign=affiliate_q4
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UTMLinkBuilder;

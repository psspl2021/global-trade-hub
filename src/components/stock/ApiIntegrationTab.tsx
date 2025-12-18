import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Key, Copy, Trash2, Check, RefreshCw, 
  AlertCircle, CheckCircle, XCircle, Clock, Code, Webhook, Settings 
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  api_key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  webhook_url: string | null;
  webhook_events: string[] | null;
}

interface SyncLog {
  id: string;
  source: string;
  products_updated: number;
  products_created: number;
  errors: number;
  status: string;
  error_details: unknown;
  created_at: string;
}

interface ApiIntegrationTabProps {
  userId: string;
}

// Generate secure random API key
function generateApiKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, 'x')
    .replace(/\//g, 'y')
    .replace(/=/g, '');
  return `sk_live_${base64}`;
}

// Hash API key for storage
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const ApiIntegrationTab = ({ userId }: ApiIntegrationTabProps) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyName, setKeyName] = useState('Default Key');
  const { toast } = useToast();

  const projectId = 'hsybhjjtxdwtpfvcmoqk';
  const apiEndpoint = `https://${projectId}.supabase.co/functions/v1/stock-sync`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysResult, logsResult] = await Promise.all([
        supabase
          .from('supplier_api_keys')
          .select('*')
          .eq('supplier_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('stock_sync_logs')
          .select('*')
          .eq('supplier_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (keysResult.error) throw keysResult.error;
      if (logsResult.error) throw logsResult.error;

      setApiKeys(keysResult.data || []);
      setSyncLogs(logsResult.data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching API data:', error);
      toast({ title: 'Error', description: 'Failed to load API data', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      toast({ title: 'Error', description: 'Please enter a key name', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12) + '...';

      const { error } = await supabase.from('supplier_api_keys').insert({
        supplier_id: userId,
        api_key_hash: keyHash,
        api_key_prefix: keyPrefix,
        name: keyName.trim(),
        is_active: true
      });

      if (error) throw error;

      setNewApiKey(rawKey);
      setKeyName('Default Key');
      fetchData();
      toast({ title: 'API Key Generated', description: 'Save this key now - it won\'t be shown again!' });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error generating API key:', error);
      toast({ title: 'Error', description: 'Failed to generate API key', variant: 'destructive' });
    }
    setGenerating(false);
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_api_keys')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', keyId);

      if (error) throw error;

      fetchData();
      toast({ title: 'API Key Revoked', description: 'This key will no longer work' });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error revoking API key:', error);
      toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' });
    }
  };

  const handleUpdateWebhook = async (keyId: string, webhookUrl: string, webhookEvents: string[]) => {
    try {
      const { error } = await supabase
        .from('supplier_api_keys')
        .update({ 
          webhook_url: webhookUrl || null, 
          webhook_events: webhookEvents 
        })
        .eq('id', keyId);

      if (error) throw error;

      fetchData();
      toast({ title: 'Webhook Updated', description: 'Notification settings saved' });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error updating webhook:', error);
      toast({ title: 'Error', description: 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'partial': return <Badge variant="secondary" className="bg-yellow-500 text-black">Partial</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activeKeys = apiKeys.filter(k => k.is_active && !k.revoked_at);

  return (
    <div className="space-y-4">
      {/* New API Key Display (shown only once after generation) */}
      {newApiKey && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Key className="h-4 w-4 text-green-600" />
          <AlertDescription className="space-y-2">
            <p className="font-medium text-green-800 dark:text-green-200">
              Save your API key now! It won't be shown again.
            </p>
            <div className="flex items-center gap-2 bg-background p-2 rounded border">
              <code className="flex-1 text-xs break-all">{newApiKey}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(newApiKey)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewApiKey(null)}
              className="mt-2"
            >
              I've saved the key
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </CardTitle>
          <CardDescription className="text-xs">
            Generate keys to sync stock from external systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate new key */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Key Name</Label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Tally Integration"
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleGenerateKey}
              disabled={generating || activeKeys.length >= 3}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Key className="h-4 w-4 mr-1" />
              )}
              Generate Key
            </Button>
          </div>

          {activeKeys.length >= 3 && (
            <p className="text-xs text-muted-foreground">
              Maximum 3 active keys allowed. Revoke an existing key to create a new one.
            </p>
          )}

          {/* Existing keys */}
          {activeKeys.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Active Keys</Label>
              {activeKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-2 border rounded bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.api_key_prefix}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(key.created_at), 'MMM d, yyyy')}
                      {key.last_used_at && (
                        <> • Last used {format(new Date(key.last_used_at), 'MMM d, h:mm a')}</>
                      )}
                    </p>
                    {key.webhook_url && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Webhook className="h-3 w-3" /> Webhook configured
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <WebhookConfigDialog apiKey={key} onSave={handleUpdateWebhook} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">T</span>
              </div>
              <div>
                <p className="font-medium text-sm">Tally Prime</p>
                <p className="text-xs text-muted-foreground">ERP Integration</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Export stock via TDL or Excel import
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => copyToClipboard(`curl -X POST "${apiEndpoint}" -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"source":"tally","items":[{"product_name":"Product","quantity":100,"unit":"kg"}]}'`)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Tally Script
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">B</span>
              </div>
              <div>
                <p className="font-medium text-sm">Busy Accounting</p>
                <p className="text-xs text-muted-foreground">Stock Sync</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Auto-sync via scheduled export
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => copyToClipboard(`curl -X POST "${apiEndpoint}" -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"source":"busy","items":[{"product_name":"Product","quantity":100,"unit":"pcs"}]}'`)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Busy Script
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Custom API</p>
                <p className="text-xs text-muted-foreground">Any Software</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              REST API for any integration
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => copyToClipboard(apiEndpoint)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Endpoint
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4" />
            Integration Guide
          </CardTitle>
          <CardDescription className="text-xs">
            Step-by-step setup for your accounting software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">API Endpoint</Label>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={() => copyToClipboard(apiEndpoint)}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <code className="text-xs bg-background p-2 rounded block break-all">
              POST {apiEndpoint}
            </code>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tally-detailed">
              <AccordionTrigger className="text-xs font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">T</span>
                  Tally Prime Step-by-Step Setup
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Method 1: Excel Export (Easiest)</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                    <li>Open Tally Prime → Go to <strong>Gateway of Tally</strong></li>
                    <li>Select <strong>Stock Summary</strong> report</li>
                    <li>Press <strong>E</strong> to Export → Choose <strong>Excel</strong></li>
                    <li>Come back to ProcureSaathi → Use <strong>Import</strong> tab</li>
                    <li>Upload the Excel file - stock syncs automatically!</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Method 2: Automated TDL (Advanced)</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                    <li>Create a TDL file with HTTP POST function</li>
                    <li>Set API endpoint: <code className="bg-muted px-1 rounded">{apiEndpoint}</code></li>
                    <li>Add header: <code className="bg-muted px-1 rounded">x-api-key: YOUR_KEY</code></li>
                    <li>Schedule daily sync via Tally's scheduler</li>
                  </ol>
                </div>
                <Alert className="mt-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Need help? Contact support@procuresaathi.com for free integration assistance!
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="busy-detailed">
              <AccordionTrigger className="text-xs font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">B</span>
                  Busy Accounting Setup
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Excel Export Method</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                    <li>Open Busy → <strong>Transactions → Inventory Reports</strong></li>
                    <li>Select <strong>Stock Summary</strong></li>
                    <li>Click <strong>Export</strong> → Choose <strong>Excel Format</strong></li>
                    <li>Upload to ProcureSaathi <strong>Import</strong> tab</li>
                  </ol>
                </div>
                <div className="space-y-2 mt-2">
                  <p className="font-medium">Required Excel Columns:</p>
                  <code className="bg-muted p-2 rounded block">
                    product_name | quantity | unit (optional)
                  </code>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-format">
              <AccordionTrigger className="text-xs font-medium">
                <span className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  API Request & Response Format
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium mb-1">Request Body:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "source": "tally",  // or "busy", "custom"
  "items": [
    {
      "product_name": "Steel Rods 12mm",
      "quantity": 500,
      "unit": "kg"  // optional, defaults to "units"
    },
    {
      "product_name": "Copper Wire 2.5mm",
      "quantity": 200,
      "unit": "meters"
    }
  ]
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Success Response:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "status": "success",
  "summary": {
    "products_updated": 2,
    "products_created": 0,
    "errors": 0
  }
}`}
                    </pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="curl">
              <AccordionTrigger className="text-xs">Complete cURL Example</AccordionTrigger>
              <AccordionContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`curl -X POST "${apiEndpoint}" \\
  -H "x-api-key: sk_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "tally",
    "items": [
      {"product_name": "Steel Rods 12mm", "quantity": 500, "unit": "kg"},
      {"product_name": "Copper Wire 2.5mm", "quantity": 200, "unit": "meters"}
    ]
  }'`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => copyToClipboard(`curl -X POST "${apiEndpoint}" -H "x-api-key: sk_live_YOUR_KEY_HERE" -H "Content-Type: application/json" -d '{"source":"tally","items":[{"product_name":"Steel Rods 12mm","quantity":500,"unit":"kg"},{"product_name":"Copper Wire 2.5mm","quantity":200,"unit":"meters"}]}'`)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Full Command
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync History
              </CardTitle>
              <CardDescription className="text-xs">
                Recent API sync attempts
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No sync attempts yet. Use the API to sync stock.
            </p>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 border rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium">{log.source}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(log.status)}
                    <p className="text-muted-foreground mt-1">
                      {log.products_updated} updated, {log.products_created} created
                      {log.errors > 0 && <span className="text-destructive">, {log.errors} errors</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Webhook Configuration Dialog Component
function WebhookConfigDialog({ 
  apiKey, 
  onSave 
}: { 
  apiKey: ApiKey; 
  onSave: (keyId: string, webhookUrl: string, webhookEvents: string[]) => Promise<void>;
}) {
  const [webhookUrl, setWebhookUrl] = useState(apiKey.webhook_url || '');
  const [events, setEvents] = useState<string[]>(apiKey.webhook_events || ['sync_failed', 'low_stock']);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(apiKey.id, webhookUrl, events);
    setSaving(false);
    setOpen(false);
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Notifications
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Webhook URL (optional)</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Receive POST requests when events occur. Supports Slack, Discord, or custom endpoints.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Events to notify</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sync_failed"
                  checked={events.includes('sync_failed')}
                  onCheckedChange={() => toggleEvent('sync_failed')}
                />
                <label htmlFor="sync_failed" className="text-sm">
                  Sync failures
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="low_stock"
                  checked={events.includes('low_stock')}
                  onCheckedChange={() => toggleEvent('low_stock')}
                />
                <label htmlFor="low_stock" className="text-sm">
                  Low stock alerts
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Webhook Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Sparkles, Mail, MessageSquare, Globe, 
  Copy, Trash2, Edit, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  category: string;
  country: string;
  channel: string;
  subject: string;
  message_body: string;
  tone: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export function AISalesMessaging() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState({
    category: '',
    country: '',
    channel: 'email',
    tone: 'professional',
  });
  const [generatedContent, setGeneratedContent] = useState<Record<string, string> | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-messaging', {
        body: { action: 'get_messages' },
      });

      if (response.error) throw response.error;
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleGenerate = async () => {
    if (!generatorConfig.category || !generatorConfig.country) {
      toast.error('Please fill category and country');
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-messaging', {
        body: { 
          action: 'generate_message',
          ...generatorConfig,
        },
      });

      if (response.error) throw response.error;
      setGeneratedContent(response.data.generated);
      toast.success('Message generated!');
    } catch (error) {
      console.error('Failed to generate message:', error);
      toast.error('Failed to generate message');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedContent) return;

    try {
      const message = {
        category: generatorConfig.category,
        country: generatorConfig.country,
        channel: generatorConfig.channel,
        tone: generatorConfig.tone,
        subject: generatedContent.subject || '',
        message_body: generatedContent.message_body || generatedContent.headline || '',
      };

      const response = await supabase.functions.invoke('ai-sales-messaging', {
        body: { action: 'save_message', message },
      });

      if (response.error) throw response.error;
      toast.success('Message saved!');
      setShowGenerator(false);
      setGeneratedContent(null);
      fetchMessages();
    } catch (error) {
      console.error('Failed to save message:', error);
      toast.error('Failed to save message');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await supabase.functions.invoke('ai-sales-messaging', {
        body: { action: 'delete_message', id },
      });

      if (response.error) throw response.error;
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'landing': return <Globe className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Sales Messaging</h3>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerator(true)}>
            <Sparkles className="w-4 h-4 mr-1" /> Generate Message
          </Button>
          <Button variant="outline" onClick={fetchMessages}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <Card className="col-span-2 p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
          </Card>
        ) : messages.length === 0 ? (
          <Card className="col-span-2 p-8 text-center text-muted-foreground">
            No messages yet. Generate your first AI-powered message!
          </Card>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id} className="overflow-hidden">
              <CardHeader className="py-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(msg.channel)}
                    <span className="font-medium capitalize">{msg.channel}</span>
                    <Badge variant="outline">{msg.tone}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(msg.message_body)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(msg.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex gap-2 mb-2">
                  <Badge>{msg.category}</Badge>
                  <Badge variant="secondary">{msg.country}</Badge>
                </div>
                {msg.subject && (
                  <p className="font-medium mb-2">{msg.subject}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {msg.message_body}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Used {msg.usage_count} times
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Message Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input 
                  placeholder="e.g., Steel, Chemicals, Textiles"
                  value={generatorConfig.category}
                  onChange={(e) => setGeneratorConfig({...generatorConfig, category: e.target.value})}
                />
              </div>
              <div>
                <Label>Target Country</Label>
                <Input 
                  placeholder="e.g., UAE, USA, Germany"
                  value={generatorConfig.country}
                  onChange={(e) => setGeneratorConfig({...generatorConfig, country: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel</Label>
                <Select 
                  value={generatorConfig.channel}
                  onValueChange={(v) => setGeneratorConfig({...generatorConfig, channel: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="landing">Landing Page Copy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select 
                  value={generatorConfig.tone}
                  onValueChange={(v) => setGeneratorConfig({...generatorConfig, tone: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Message
                </>
              )}
            </Button>

            {generatedContent && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <h4 className="font-medium">Generated Content:</h4>
                
                {generatedContent.subject && (
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <p className="font-medium">{generatedContent.subject}</p>
                  </div>
                )}
                
                {generatedContent.headline && (
                  <div>
                    <Label className="text-xs">Headline</Label>
                    <p className="font-medium text-lg">{generatedContent.headline}</p>
                  </div>
                )}

                {generatedContent.subheadline && (
                  <div>
                    <Label className="text-xs">Subheadline</Label>
                    <p>{generatedContent.subheadline}</p>
                  </div>
                )}
                
                {generatedContent.message_body && (
                  <div>
                    <Label className="text-xs">Message</Label>
                    <p className="whitespace-pre-wrap text-sm">{generatedContent.message_body}</p>
                  </div>
                )}

                {generatedContent.cta_text && (
                  <div>
                    <Label className="text-xs">CTA</Label>
                    <Button size="sm" className="mt-1">{generatedContent.cta_text}</Button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveGenerated} size="sm">
                    Save Message
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(
                      Object.values(generatedContent).join('\n\n')
                    )}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleGenerate}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

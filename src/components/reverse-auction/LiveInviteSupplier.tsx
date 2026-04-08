/**
 * Lightweight inline supplier invite panel for live auctions.
 * Allows buyers to add more suppliers mid-auction without leaving the live view.
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Send, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveInviteSupplierProps {
  auctionId: string;
  auctionTitle?: string;
  onInvited?: () => void;
}

export function LiveInviteSupplier({ auctionId, auctionTitle, onInvited }: LiveInviteSupplierProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [justInvited, setJustInvited] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInvite = useCallback(async () => {
    if (isAdding) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }

    // Prevent self-invite
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.toLowerCase() === trimmed) {
      toast({ title: "You can't invite yourself", variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from('reverse_auction_suppliers')
        .select('id, is_active')
        .eq('auction_id', auctionId)
        .eq('supplier_email', trimmed)
        .maybeSingle();

      if (existing?.is_active) {
        toast({ title: 'Supplier already invited', variant: 'destructive' });
        setIsAdding(false);
        return;
      }

      if (existing && !existing.is_active) {
        // Re-activate
        await supabase
          .from('reverse_auction_suppliers')
          .update({ is_active: true } as any)
          .eq('id', existing.id);
      } else {
        // Resolve supplier_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', trimmed)
          .maybeSingle();

        const { error } = await supabase.from('reverse_auction_suppliers').insert({
          auction_id: auctionId,
          supplier_email: trimmed,
          supplier_id: profile?.id || null,
          supplier_source: 'buyer_invite',
        } as any);

        if (error) throw error;
      }

      // Send invitation email
      const auctionLink = `${window.location.origin}/reverse-auction/${auctionId}`;
      supabase.functions.invoke('send-auction-invite', {
        body: {
          email: trimmed,
          auctionTitle: auctionTitle || 'Live Auction',
          auctionId,
          auctionLink,
        },
      }).catch((err) => console.error('Email send failed:', err));

      // Show inline confirmation
      setJustInvited(trimmed);
      setEmail('');
      onInvited?.();
      toast({ title: `✅ ${trimmed} invited & notified` });

      // Clear confirmation after 3s and close
      setTimeout(() => {
        setJustInvited(null);
        setIsOpen(false);
      }, 3000);
    } catch (err: any) {
      toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  }, [email, auctionId, auctionTitle, toast, onInvited, isAdding]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Supplier
      </Button>
    );
  }

  // Show inline confirmation
  if (justInvited) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-300">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{justInvited} invited just now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
      <Input
        type="email"
        placeholder="supplier@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
        className="h-8 text-xs w-52"
        autoFocus
        disabled={isAdding}
      />
      <Button
        size="sm"
        onClick={handleInvite}
        disabled={isAdding || !email.trim()}
        className="h-8 gap-1 text-xs px-3"
      >
        {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        Send
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setIsOpen(false); setEmail(''); }}
        className="h-8 w-8 p-0"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/**
 * Lightweight inline supplier invite panel for live auctions.
 * Allows buyers to add more suppliers mid-auction without leaving the live view.
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Send, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveInviteSupplierProps {
  auctionId: string;
  onInvited?: () => void;
}

export function LiveInviteSupplier({ auctionId, onInvited }: LiveInviteSupplierProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleInvite = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
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
        toast({ title: `✅ ${trimmed} re-invited to auction` });
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
        toast({ title: `✅ ${trimmed} invited to live auction` });
      }

      setEmail('');
      setIsOpen(false);
      onInvited?.();
    } catch (err: any) {
      toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  }, [email, auctionId, toast, onInvited]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Invite Supplier
      </Button>
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

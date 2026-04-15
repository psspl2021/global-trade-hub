/**
 * Auction Chat & Negotiation Panel
 * WhatsApp-style real-time chat with counter-offer support
 * and reply-to-specific-supplier threading for buyers.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Send, IndianRupee, Check, X,
  ArrowRightLeft, ChevronDown, ChevronUp, Zap,
  Reply, XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuctionMessage {
  id: string;
  auction_id: string;
  sender_id: string;
  sender_role: 'buyer' | 'supplier' | 'system';
  message: string;
  message_type: 'text' | 'counter_offer' | 'system';
  counter_price: number | null;
  is_read: boolean;
  seen_by_buyer: boolean;
  created_at: string;
  reply_to_supplier_id: string | null;
  reply_to_message_id: string | null;
}

interface CounterOffer {
  id: string;
  auction_id: string;
  supplier_id: string;
  buyer_id: string;
  original_bid_price: number | null;
  counter_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
}

interface AuctionChatProps {
  auctionId: string;
  buyerId: string;
  isBuyer: boolean;
  isLive: boolean;
  currentL1?: number | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function AuctionChat({ auctionId, buyerId, isBuyer, isLive, currentL1 }: AuctionChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AuctionMessage[]>([]);
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [input, setInput] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reply-to state: buyer selects a message to reply to a specific supplier
  const [replyTo, setReplyTo] = useState<AuctionMessage | null>(null);

  // Resolve sender IDs to company names via security-definer RPC
  useEffect(() => {
    const msgIds = messages.map(m => m.sender_id);
    const offerIds = counterOffers.map(o => o.supplier_id);
    const allIds = [...new Set([...msgIds, ...offerIds])].filter(id => id && !senderNames[id]);
    if (allIds.length === 0) return;
    supabase
      .rpc('get_company_names', { user_ids: allIds })
      .then(({ data, error }) => {
        if (data && !error) {
          setSenderNames(prev => {
            const next = { ...prev };
            (data as any[]).forEach((p) => { next[p.id] = p.company_name; });
            return next;
          });
        }
      });
  }, [messages, counterOffers]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('auction_messages')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: true });
    if (data) {
      // Suppliers should only see their own messages + buyer/system messages (privacy)
      // For targeted buyer replies, suppliers only see replies directed to them
      const filtered = isBuyer
        ? data
        : data.filter((m: any) =>
            m.sender_id === user?.id ||
            m.sender_role === 'system' ||
            (m.sender_role === 'buyer' && (
              !m.reply_to_supplier_id || m.reply_to_supplier_id === user?.id
            ))
          );
      setMessages(filtered as unknown as AuctionMessage[]);
    }
  }, [auctionId, isBuyer, user?.id]);

  const fetchCounterOffers = useCallback(async () => {
    let query = supabase
      .from('auction_counter_offers')
      .select('*')
      .eq('auction_id', auctionId);
    // Suppliers should only see their own counter offers
    if (!isBuyer && user?.id) {
      query = query.eq('supplier_id', user.id);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setCounterOffers(data as unknown as CounterOffer[]);
  }, [auctionId, isBuyer, user?.id]);

  useEffect(() => {
    fetchMessages();
    fetchCounterOffers();
  }, [fetchMessages, fetchCounterOffers]);

  // Mark messages as seen by buyer when chat is open
  useEffect(() => {
    if (!isBuyer || !isExpanded || messages.length === 0) return;
    const unseenIds = messages
      .filter(m => m.sender_role === 'supplier' && !m.seen_by_buyer)
      .map(m => m.id);
    if (unseenIds.length > 0) {
      supabase
        .from('auction_messages')
        .update({ seen_by_buyer: true } as any)
        .eq('auction_id', auctionId)
        .eq('sender_role', 'supplier')
        .then();
    }
  }, [isBuyer, isExpanded, messages, auctionId]);

  // Realtime
  useAuctionRealtime(auctionId, {
    onMessage: (msg) => {
      // Privacy: suppliers only see their own + buyer/system messages
      if (!isBuyer && msg.sender_id !== user?.id && msg.sender_role !== 'system') {
        // For buyer messages, only show if directed to this supplier or broadcast
        if (msg.sender_role === 'buyer') {
          const replyTarget = (msg as any).reply_to_supplier_id;
          if (replyTarget && replyTarget !== user?.id) return;
        } else {
          return;
        }
      }
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg as AuctionMessage];
      });
    },
    onCounterOffer: () => fetchCounterOffers(),
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Smart counter suggestions
  const counterSuggestions = useMemo(() => {
    if (!currentL1 || currentL1 <= 0) return [];
    return [
      { label: 'Beat L1 by 3%', price: Math.floor(currentL1 * 0.97) },
      { label: 'Beat L1 by 5%', price: Math.floor(currentL1 * 0.95) },
    ];
  }, [currentL1]);

  // Handle clicking a supplier message to set reply context (buyer only)
  const handleSelectReply = (msg: AuctionMessage) => {
    if (!isBuyer || msg.sender_role !== 'supplier') return;
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const clearReply = () => setReplyTo(null);

  const sendMessage = async () => {
    if (!input.trim() || !user || isSending) return;
    // Rate limit: 1 msg per second
    if (Date.now() - lastSentRef.current < 1000) {
      toast.error('Slow down — wait a moment');
      return;
    }
    lastSentRef.current = Date.now();
    setIsSending(true);
    try {
      const insertData: any = {
        auction_id: auctionId,
        sender_id: user.id,
        sender_role: isBuyer ? 'buyer' : 'supplier',
        message: input.trim(),
        message_type: 'text',
      };

      // If buyer is replying to a specific supplier message
      if (isBuyer && replyTo) {
        insertData.reply_to_supplier_id = replyTo.sender_id;
        insertData.reply_to_message_id = replyTo.id;
      }

      const { error } = await supabase.from('auction_messages').insert(insertData);
      if (error) throw error;
      setInput('');
      setReplyTo(null);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const sendCounterOffer = async () => {
    if (!counterPrice || !user || isSending) return;
    const price = Number(counterPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (Date.now() - lastSentRef.current < 1000) {
      toast.error('Slow down — wait a moment');
      return;
    }
    lastSentRef.current = Date.now();
    setIsSending(true);
    try {
      // Insert counter offer
      await supabase.from('auction_counter_offers').insert({
        auction_id: auctionId,
        supplier_id: isBuyer ? '' : user.id,
        buyer_id: buyerId,
        counter_price: price,
        status: 'pending',
      } as any);

      // Insert message
      await supabase.from('auction_messages').insert({
        auction_id: auctionId,
        sender_id: user.id,
        sender_role: isBuyer ? 'buyer' : 'supplier',
        message: `Counter offer: ${formatCurrency(price)}`,
        message_type: 'counter_offer',
        counter_price: price,
      } as any);

      setCounterPrice('');
      setShowCounter(false);
      toast.success('Counter offer sent!');
    } catch {
      toast.error('Failed to send counter offer');
    } finally {
      setIsSending(false);
    }
  };

  const respondToOffer = async (offerId: string, status: 'accepted' | 'rejected') => {
    try {
      await supabase
        .from('auction_counter_offers')
        .update({
          status,
          responded_at: new Date().toISOString(),
        } as any)
        .eq('id', offerId);

      // System message
      await supabase.from('auction_messages').insert({
        auction_id: auctionId,
        sender_id: user!.id,
        sender_role: 'system',
        message: `Counter offer ${status}`,
        message_type: 'system',
      } as any);

      toast.success(`Offer ${status}`);
      fetchCounterOffers();
    } catch {
      toast.error('Failed to respond');
    }
  };

  // Find the original message for a reply reference
  const getReplyReference = (msg: AuctionMessage): AuctionMessage | undefined => {
    if (!msg.reply_to_message_id) return undefined;
    return messages.find(m => m.id === msg.reply_to_message_id);
  };

  const pendingOffers = counterOffers.filter(o => o.status === 'pending');

  return (
    <Card className="border-border">
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(p => !p)}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Negotiation Chat
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
            )}
            {pendingOffers.length > 0 && (
              <span className="animate-pulse text-destructive text-lg leading-none">●</span>
            )}
            {pendingOffers.length > 0 && (
              <Badge className="bg-amber-500 text-white text-xs">
                {pendingOffers.length} pending
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          {/* Pending counter offers for buyer */}
          {isBuyer && pendingOffers.length > 0 && (
            <div className="space-y-2">
              {pendingOffers.map(offer => (
                <div
                  key={offer.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Counter offer from </span>
                      <span className="font-medium">{senderNames[offer.supplier_id] || `PS-${offer.supplier_id.slice(0, 4).toUpperCase()}`}</span>
                    </div>
                    <span className="text-lg font-bold text-amber-700">
                      {formatCurrency(offer.counter_price)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1 flex-1"
                      onClick={() => respondToOffer(offer.id, 'accepted')}
                    >
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 flex-1"
                      onClick={() => respondToOffer(offer.id, 'rejected')}
                    >
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-[280px] overflow-y-auto space-y-2 rounded-lg bg-muted/30 p-3"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const isSystem = msg.sender_role === 'system';
                const isCounter = msg.message_type === 'counter_offer';
                const isSupplierMsg = msg.sender_role === 'supplier';
                const replyRef = getReplyReference(msg);
                const isTargetedReply = msg.sender_role === 'buyer' && msg.reply_to_supplier_id;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 relative ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border rounded-bl-md'
                      } ${isBuyer && isSupplierMsg ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all' : ''}`}
                      onClick={() => handleSelectReply(msg)}
                    >
                      {/* Reply reference bubble */}
                      {replyRef && (
                        <div className={`text-xs rounded px-2 py-1 mb-1.5 border-l-2 ${
                          isMe 
                            ? 'bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground/80' 
                            : 'bg-muted border-primary/40 text-muted-foreground'
                        }`}>
                          <span className="font-medium">
                            ↩ {senderNames[replyRef.sender_id] || `PS-${replyRef.sender_id.slice(0, 4).toUpperCase()}`}
                          </span>
                          <p className="truncate">{replyRef.message}</p>
                        </div>
                      )}

                      {/* Targeted reply indicator (buyer side) */}
                      {isTargetedReply && isBuyer && (
                        <div className="text-xs flex items-center gap-1 mb-1 opacity-70">
                          <Reply className="w-3 h-3" />
                          To: {senderNames[msg.reply_to_supplier_id!] || `PS-${msg.reply_to_supplier_id!.slice(0, 4).toUpperCase()}`}
                        </div>
                      )}

                      {!isMe && (
                        <p className="text-xs font-medium text-muted-foreground mb-0.5 capitalize">
                          {msg.sender_role} • {senderNames[msg.sender_id] || `PS-${msg.sender_id.slice(0, 4).toUpperCase()}`}
                        </p>
                      )}
                      {isCounter ? (
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4" />
                          <span className="font-semibold">
                            {formatCurrency(msg.counter_price!)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.message}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                        {/* Reply button on hover (buyer only, supplier messages) */}
                        {isBuyer && isSupplierMsg && (
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-0.5 text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); handleSelectReply(msg); }}
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Supplier L1 status */}
          {!isBuyer && isLive && currentL1 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Current L1: {formatCurrency(currentL1)}
            </div>
          )}

          {/* Reply-to indicator */}
          {isBuyer && replyTo && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Reply className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Replying to {senderNames[replyTo.sender_id] || `PS-${replyTo.sender_id.slice(0, 4).toUpperCase()}`}
                </p>
                <p className="text-xs text-muted-foreground truncate">{replyTo.message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={clearReply}
              >
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {/* Input area */}
          {isLive && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    replyTo
                      ? `Reply to ${senderNames[replyTo.sender_id] || 'supplier'}...`
                      : 'Type a message...'
                  }
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isSending}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isSending}
                >
                  <Send className="w-4 h-4" />
                </Button>
                {!isBuyer && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowCounter(p => !p)}
                    className={showCounter ? 'border-primary text-primary' : ''}
                  >
                    <IndianRupee className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Counter offer input with smart suggestions */}
              {showCounter && !isBuyer && (
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-2">
                  {counterSuggestions.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {counterSuggestions.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setCounterPrice(String(s.price))}
                          className="text-xs border border-border bg-background px-2 py-1 rounded-md hover:bg-muted transition-colors"
                        >
                          ⚡ {s.label} ({formatCurrency(s.price)})
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="relative flex-1">
                      <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Your counter price"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        className="pl-7 h-9"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={sendCounterOffer}
                      disabled={!counterPrice || isSending}
                      className="gap-1"
                    >
                      <Send className="w-3 h-3" /> Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLive && (
            <p className="text-xs text-center text-muted-foreground">
              Chat is available during live auctions only.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

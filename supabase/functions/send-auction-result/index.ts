import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auction_id } = await req.json();

    if (!auction_id) {
      return new Response(JSON.stringify({ error: 'auction_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch auction details
    const { data: auction, error: auctionError } = await supabase
      .from('reverse_auctions')
      .select('*')
      .eq('id', auction_id)
      .single();

    if (auctionError || !auction) {
      console.error('Failed to fetch auction:', auctionError);
      return new Response(JSON.stringify({ error: 'Auction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all bids sorted by price
    const { data: bids, error: bidsError } = await supabase
      .from('reverse_auction_bids')
      .select('*')
      .eq('auction_id', auction_id)
      .order('bid_price', { ascending: true });

    if (bidsError || !bids?.length) {
      console.log('No bids found for auction:', auction_id);
      return new Response(JSON.stringify({ message: 'No bids to notify' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all invited suppliers to get emails
    const { data: suppliers, error: suppliersError } = await supabase
      .from('reverse_auction_suppliers')
      .select('supplier_id, supplier_email, supplier_company_name')
      .eq('auction_id', auction_id);

    if (suppliersError) {
      console.error('Failed to fetch suppliers:', suppliersError);
    }

    // Build supplier email map
    const supplierMap = new Map<string, { email: string; company: string }>();
    for (const s of suppliers || []) {
      if (s.supplier_id && s.supplier_email) {
        supplierMap.set(s.supplier_id, {
          email: s.supplier_email,
          company: s.supplier_company_name || 'Supplier',
        });
      }
    }

    const winnerBid = bids[0];
    const winnerInfo = supplierMap.get(winnerBid.supplier_id);
    const currency = auction.currency || 'INR';
    const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

    const emailResults: string[] = [];

    // 1. Send winner notification
    if (winnerInfo?.email) {
      try {
        const winnerRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ProcureSaathi <auctions@procuresaathi.com>',
            to: [winnerInfo.email],
            subject: `🎉 Congratulations! You Won — ${auction.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #fff; margin: 0; font-size: 22px;">🏆 You Won the Reverse Auction!</h1>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
                  <p style="color: #374151; font-size: 16px; margin-top: 0;">
                    Congratulations <strong>${winnerInfo.company}</strong>! Your bid has been selected as the winning bid.
                  </p>
                  
                  <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h2 style="color: #166534; margin: 0 0 12px 0; font-size: 18px;">${auction.title}</h2>
                    <table style="width: 100%; font-size: 14px; color: #374151;">
                      <tr><td style="padding: 4px 0; font-weight: 600;">Product:</td><td>${auction.product_slug}</td></tr>
                      <tr><td style="padding: 4px 0; font-weight: 600;">Quantity:</td><td>${auction.quantity} ${auction.unit}</td></tr>
                      <tr><td style="padding: 4px 0; font-weight: 600;">Your Winning Bid:</td><td style="color: #16a34a; font-weight: 700; font-size: 16px;">${currencySymbol}${winnerBid.bid_price}</td></tr>
                    </table>
                  </div>

                  <p style="color: #374151; font-size: 14px;">
                    The buyer will contact you shortly to finalize the order. Please keep your offer terms ready.
                  </p>
                  
                  <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
                    Thank you for participating on ProcureSaathi.
                  </p>
                </div>
                <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
                  ProcureSaathi — India's B2B Procurement Platform
                </p>
              </div>
            `,
          }),
        });
        const winnerResBody = await winnerRes.text();
        emailResults.push(`Winner (${winnerInfo.email}): ${winnerRes.ok ? 'sent' : winnerResBody}`);
      } catch (e) {
        console.error('Failed to send winner email:', e);
        emailResults.push(`Winner email failed: ${e}`);
      }
    }

    // 2. Notify losing suppliers
    for (const bid of bids.slice(1)) {
      const info = supplierMap.get(bid.supplier_id);
      if (!info?.email) continue;

      try {
        const loserRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ProcureSaathi <auctions@procuresaathi.com>',
            to: [info.email],
            subject: `Auction Closed — ${auction.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #fff; margin: 0; font-size: 22px;">Auction Completed</h1>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
                  <p style="color: #374151; font-size: 16px; margin-top: 0;">
                    Dear <strong>${info.company}</strong>, the reverse auction <strong>"${auction.title}"</strong> has been completed.
                  </p>
                  <p style="color: #374151; font-size: 14px;">
                    Unfortunately, your bid was not selected this time. We appreciate your participation and encourage you to join future auctions.
                  </p>
                  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 14px; color: #374151;">
                      <tr><td style="padding: 4px 0; font-weight: 600;">Your Bid:</td><td>${currencySymbol}${bid.bid_price}</td></tr>
                      <tr><td style="padding: 4px 0; font-weight: 600;">Total Bids:</td><td>${bids.length}</td></tr>
                    </table>
                  </div>
                  <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
                    Stay tuned for more procurement opportunities on ProcureSaathi.
                  </p>
                </div>
                <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
                  ProcureSaathi — India's B2B Procurement Platform
                </p>
              </div>
            `,
          }),
        });
        const loserResBody = await loserRes.text();
        emailResults.push(`Loser (${info.email}): ${loserRes.ok ? 'sent' : loserResBody}`);
      } catch (e) {
        console.error(`Failed to send loser email to ${info.email}:`, e);
        emailResults.push(`Loser email failed (${info.email}): ${e}`);
      }
    }

    // 3. Mark winning bid
    await supabase
      .from('reverse_auction_bids')
      .update({ is_winning: true })
      .eq('id', winnerBid.id);

    // 4. Notify buyer about auction completion
    if (auction.buyer_id) {
      try {
        const { data: buyer } = await supabase
          .from('profiles')
          .select('email, company_name')
          .eq('id', auction.buyer_id)
          .single();

        if (buyer?.email) {
          const buyerRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ProcureSaathi <auctions@procuresaathi.com>',
              to: [buyer.email],
              subject: `🏁 Auction Completed — ${auction.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 22px;">🏁 Your Auction Has Completed</h1>
                  </div>
                  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
                    <p style="color: #374151; font-size: 16px; margin-top: 0;">
                      Dear <strong>${buyer.company_name || 'Buyer'}</strong>, your reverse auction has successfully closed.
                    </p>
                    
                    <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <h2 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">${auction.title}</h2>
                      <table style="width: 100%; font-size: 14px; color: #374151;">
                        <tr><td style="padding: 4px 0; font-weight: 600;">Winning Supplier:</td><td>${winnerInfo?.company || 'N/A'}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 600;">Winning Price:</td><td style="color: #2563eb; font-weight: 700; font-size: 16px;">${currencySymbol}${winnerBid.bid_price}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 600;">Total Bids Received:</td><td>${bids.length}</td></tr>
                      </table>
                    </div>

                    <p style="color: #374151; font-size: 14px;">
                      You can now proceed with order finalization. The winning supplier has been notified and is awaiting your confirmation.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
                      Log in to ProcureSaathi to review the full results and initiate the order.
                    </p>
                  </div>
                  <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
                    ProcureSaathi — India's B2B Procurement Platform
                  </p>
                </div>
              `,
            }),
          });
          const buyerResBody = await buyerRes.text();
          emailResults.push(`Buyer (${buyer.email}): ${buyerRes.ok ? 'sent' : buyerResBody}`);
        }
      } catch (e) {
        console.error('Failed to send buyer email:', e);
        emailResults.push(`Buyer email failed: ${e}`);
      }
    }

    console.log('Auction result emails:', emailResults);

    return new Response(JSON.stringify({ success: true, results: emailResults }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-auction-result:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AFFILIATE AUTO-NUDGE CRON
 * 
 * Runs daily to automatically detect and nudge affiliates based on rules:
 * 
 * 1. 0 referrals + joined >= 2 days ago → "start now" nudge
 * 2. >0 referrals, 0 rewarded + last active >= 3 days → "you're close" nudge
 * 3. rewarded >0 + inactive >= 5 days → "scale up" nudge
 * 
 * Sends WhatsApp via Brevo, logs nudge, updates last_nudged_at.
 * Cooldown: won't re-nudge within 3 days of last nudge.
 * Daily limit: 150 nudges max per run (enforced per-item, not per-batch).
 */

interface AffiliateNudgeCandidate {
  user_id: string;
  contact_person: string;
  phone: string;
  email: string;
  joined_at: string | null;
  last_nudged_at: string | null;
  last_nudge_type: string | null;
  total_referrals: number;
  signed_up_referrals: number;
  rewarded_referrals: number;
  last_referral_at: string | null;
}

const NUDGE_COOLDOWN_DAYS = 3;
const MAX_DAILY_NUDGES = 150;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

function formatPhone(raw: string): string | null {
  const clean = raw.replace(/\D/g, '');
  if (clean.startsWith('91') && clean.length === 12) return clean;
  if (clean.length === 10) return `91${clean}`;
  return clean.length >= 10 ? clean : null;
}

function getNudgeType(candidate: AffiliateNudgeCandidate): { type: string; message: string } | null {
  const now = Date.now();
  const dayMs = 86400000;

  const joinedDaysAgo = candidate.joined_at
    ? (now - new Date(candidate.joined_at).getTime()) / dayMs
    : 999;

  const lastActiveDaysAgo = candidate.last_referral_at
    ? (now - new Date(candidate.last_referral_at).getTime()) / dayMs
    : 999;

  if (candidate.total_referrals === 0 && joinedDaysAgo >= 2) {
    return {
      type: 'activation',
      message: `Hi ${candidate.contact_person}, you joined ProcureSaathi but haven't started earning yet! Share your referral link with just 5 suppliers to unlock your first commission. It takes 30 seconds — start now! 🚀`,
    };
  }

  if (candidate.total_referrals > 0 && candidate.rewarded_referrals === 0 && lastActiveDaysAgo >= 3) {
    return {
      type: 'conversion_push',
      message: `Hi ${candidate.contact_person}, you're so close! You've invited ${candidate.total_referrals} supplier(s) — help them complete signup and place their first order to earn your commission. One follow-up call can make the difference! 💪`,
    };
  }

  if (candidate.rewarded_referrals > 0 && lastActiveDaysAgo >= 5) {
    return {
      type: 'scale_up',
      message: `Hi ${candidate.contact_person}, great work earning ${candidate.rewarded_referrals} commission(s)! Scale this further — invite 10 more suppliers to unlock higher commission tiers. Your network is your earning potential! 📈`,
    };
  }

  return null;
}

async function sendWhatsAppViaBravo(phone: string, message: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn("[auto-nudge] BREVO_API_KEY not set, skipping WhatsApp send");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.brevo.com/v3/whatsapp/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        senderNumber: Deno.env.get("BREVO_WHATSAPP_SENDER") || "",
        recipientNumber: phone,
        text: message,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.message === 'error' || data?.status === 'failed') {
      console.error(`[auto-nudge] WhatsApp failed for ${phone}:`, data);
      return false;
    }

    return !!data?.messageId || data?.status === 'queued';
  } catch (err) {
    console.error(`[auto-nudge] Failed to send WhatsApp to ${phone}:`, err);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!authHeader?.includes(supabaseAnonKey || "___")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    console.log("[auto-nudge] Starting affiliate auto-nudge...");

    // Run conversion detection BEFORE processing (catch previous run's conversions)
    await supabase.rpc('detect_nudge_conversions');

    // 1. Get all affiliate user IDs
    const { data: roleRows, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'affiliate');

    if (roleError) throw roleError;
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ success: true, nudged: 0, message: "No affiliates found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = roleRows.map(r => r.user_id);

    // 2. Fetch profiles, affiliates, referrals, AND recent nudges in parallel
    const [profilesRes, affiliatesRes, referralsRes, recentNudgesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, contact_person, phone, email')
        .in('id', userIds),
      supabase
        .from('affiliates')
        .select('user_id, joined_at, last_nudged_at, last_nudge_type')
        .in('user_id', userIds),
      supabase
        .from('referrals')
        .select('referrer_id, status, created_at')
        .in('referrer_id', userIds),
      // FIX #2: Pre-fetch all recent nudges in ONE query (no per-candidate DB hit)
      supabase
        .from('affiliate_nudge_logs')
        .select('affiliate_user_id, nudge_type')
        .gte('sent_at', new Date(Date.now() - 86400000).toISOString()),
    ]);

    const profiles = profilesRes.data || [];
    const affiliates = affiliatesRes.data || [];
    const referrals = referralsRes.data || [];

    // Build recent nudge dedup set
    const recentNudgeSet = new Set(
      (recentNudgesRes.data || []).map(n => `${n.affiliate_user_id}_${n.nudge_type}`)
    );

    // 3. Build referral stats
    const refStats = new Map<string, { total: number; signedUp: number; rewarded: number; lastReferralAt: string | null }>();
    referrals.forEach(r => {
      const s = refStats.get(r.referrer_id) || { total: 0, signedUp: 0, rewarded: 0, lastReferralAt: null };
      s.total++;
      if (r.status === 'signed_up' || r.status === 'rewarded') s.signedUp++;
      if (r.status === 'rewarded') s.rewarded++;
      if (!s.lastReferralAt || (r.created_at && r.created_at > s.lastReferralAt)) {
        s.lastReferralAt = r.created_at;
      }
      refStats.set(r.referrer_id, s);
    });

    // 4. Build candidates
    const candidates: AffiliateNudgeCandidate[] = userIds.map(uid => {
      const profile = profiles.find(p => p.id === uid);
      const aff = affiliates.find(a => a.user_id === uid);
      const stats = refStats.get(uid) || { total: 0, signedUp: 0, rewarded: 0, lastReferralAt: null };

      return {
        user_id: uid,
        contact_person: profile?.contact_person || 'User',
        phone: profile?.phone || '',
        email: profile?.email || '',
        joined_at: aff?.joined_at || null,
        last_nudged_at: aff?.last_nudged_at || null,
        last_nudge_type: aff?.last_nudge_type || null,
        total_referrals: stats.total,
        signed_up_referrals: stats.signedUp,
        rewarded_referrals: stats.rewarded,
        last_referral_at: stats.lastReferralAt,
      };
    });

    // 5. Filter eligible candidates + improved priority scoring
    let skippedCooldown = 0;
    let skippedNoPhone = 0;
    let skippedDuplicateType = 0;

    const eligibleNudges: Array<{ candidate: AffiliateNudgeCandidate; nudge: { type: string; message: string }; phone: string; priorityScore: number }> = [];

    for (const candidate of candidates) {
      if (candidate.last_nudged_at) {
        const daysSinceNudge = (Date.now() - new Date(candidate.last_nudged_at).getTime()) / 86400000;
        if (daysSinceNudge < NUDGE_COOLDOWN_DAYS) {
          skippedCooldown++;
          continue;
        }
      }

      const nudge = getNudgeType(candidate);
      if (!nudge) continue;

      // FIX #2: Use pre-fetched Set instead of per-candidate DB query
      if (recentNudgeSet.has(`${candidate.user_id}_${nudge.type}`)) {
        skippedDuplicateType++;
        continue;
      }

      if (candidate.last_nudge_type === nudge.type) {
        skippedDuplicateType++;
        continue;
      }

      const formattedPhone = candidate.phone ? formatPhone(candidate.phone) : null;
      if (!formattedPhone) {
        skippedNoPhone++;
        continue;
      }

      // Improved priority scoring
      const joinedDaysAgo = candidate.joined_at
        ? (Date.now() - new Date(candidate.joined_at).getTime()) / 86400000
        : 999;
      const daysSinceLastReferral = candidate.last_referral_at
        ? (Date.now() - new Date(candidate.last_referral_at).getTime()) / 86400000
        : 999;

      const priorityScore =
        (formattedPhone ? 4 : 0) +
        (candidate.rewarded_referrals === 0 ? 3 : 0) +
        (candidate.total_referrals > 0 ? 2 : 0) +
        (candidate.signed_up_referrals > 0 ? 2 : 0) +
        (daysSinceLastReferral >= 3 ? 2 : 0) +
        (joinedDaysAgo <= 3 ? 1 : 0);

      eligibleNudges.push({ candidate, nudge, phone: formattedPhone, priorityScore });
    }

    // Sort by priority (highest first)
    eligibleNudges.sort((a, b) => b.priorityScore - a.priorityScore);

    // 6. Batch process with per-item daily limit enforcement
    const BATCH_SIZE = 15;
    let nudgedCount = 0;
    const nudgeResults: Array<{ user_id: string; type: string; sent: boolean }> = [];
    let dailyLimitReached = false;

    for (let i = 0; i < eligibleNudges.length; i += BATCH_SIZE) {
      // FIX #1: Slice batch to remaining slots — mathematically prevents overshoot
      const remainingSlots = MAX_DAILY_NUDGES - nudgedCount;
      if (remainingSlots <= 0) {
        dailyLimitReached = true;
        break;
      }

      const batch = eligibleNudges.slice(i, i + Math.min(BATCH_SIZE, remainingSlots));

      const results = await Promise.all(
        batch.map(async ({ candidate, nudge, phone }) => {

          let sent = await sendWhatsAppViaBravo(phone, nudge.message);

          // FIX #4: Safe retry — only if original definitively failed
          if (!sent) {
            await new Promise(res => setTimeout(res, 300));
            const retrySent = await sendWhatsAppViaBravo(phone, nudge.message);
            if (retrySent && !sent) {
              sent = true;
            }
          }

          // Log nudge regardless (for audit trail)
          await supabase.from('affiliate_nudge_logs').insert({
            affiliate_user_id: candidate.user_id,
            nudge_type: nudge.type,
            channel: sent ? 'whatsapp' : 'whatsapp_failed',
            message: nudge.message,
            sent_at: new Date().toISOString(),
          });

          // Idempotent update cooldown
          if (sent) {
            const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
            await supabase
              .from('affiliates')
              .update({
                last_nudged_at: new Date().toISOString(),
                last_nudge_type: nudge.type,
              })
              .eq('user_id', candidate.user_id)
              .or(`last_nudged_at.is.null,last_nudged_at.lt.${oneDayAgo}`);
          }

          return { user_id: candidate.user_id, type: nudge.type, sent };
        })
      );

      // FIX #1: Only count results up to the limit
      results.forEach(r => {
        if (r === null) return;
        if (r.sent && nudgedCount < MAX_DAILY_NUDGES) {
          nudgedCount++;
        }
        nudgeResults.push(r);
      });

      // Rate-limit pause between batches
      if (i + BATCH_SIZE < eligibleNudges.length && nudgedCount < MAX_DAILY_NUDGES) {
        await new Promise(res => setTimeout(res, 500));
      }
    }

    const failedCount = nudgeResults.filter(r => !r.sent).length;

    // FIX #3: Run conversion detection AFTER all sends too (catch edge timing)
    await supabase.rpc('detect_nudge_conversions');

    // Log summary
    console.log('[auto-nudge summary]', {
      total_candidates: candidates.length,
      eligible: eligibleNudges.length,
      sent: nudgedCount,
      failed: failedCount,
      skippedCooldown,
      skippedNoPhone,
      skippedDuplicateType,
      dailyLimitReached,
    });

    // Log to admin activity
    if (nudgedCount > 0) {
      await supabase.from('admin_activity_logs').insert({
        action_type: 'affiliate_auto_nudge',
        admin_id: '00000000-0000-0000-0000-000000000000',
        metadata: {
          nudged: nudgedCount,
          failed: failedCount,
          skipped_cooldown: skippedCooldown,
          skipped_no_phone: skippedNoPhone,
          skipped_duplicate_type: skippedDuplicateType,
          daily_limit_reached: dailyLimitReached,
          results: nudgeResults,
          run_at: new Date().toISOString(),
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        nudged: nudgedCount,
        failed: failedCount,
        skipped_cooldown: skippedCooldown,
        skipped_no_phone: skippedNoPhone,
        skipped_duplicate_type: skippedDuplicateType,
        total_affiliates: candidates.length,
        daily_limit_reached: dailyLimitReached,
        success_rate: eligibleNudges.length > 0
          ? Math.round((nudgedCount / eligibleNudges.length) * 100 * 100) / 100
          : 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[auto-nudge] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

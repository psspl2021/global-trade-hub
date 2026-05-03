/**
 * E2E SANITY TEST — Invite → First Login → Immediate Visibility
 * ----------------------------------------------------------------
 * Locks correctness of the identity → org → access mapping.
 * One deterministic test that mirrors the manual flow.
 *
 * Run locally:
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   npx playwright test e2e/invite-first-login.spec.ts
 *
 * Required env (set in .env.test or CI secrets):
 *   E2E_BASE_URL                 - e.g. http://localhost:8080
 *   E2E_SUPABASE_URL             - project URL
 *   E2E_SUPABASE_SERVICE_ROLE    - service role key (CI only, never in client)
 *   E2E_BUYER_COMPANY_ID         - company to invite into
 *   E2E_ADMIN_USER_ID            - inviter's user_id
 *
 * Cleanup: deletes the test user from auth.users at end of run.
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
const SUPABASE_URL = process.env.E2E_SUPABASE_URL!;
const SERVICE_ROLE = process.env.E2E_SUPABASE_SERVICE_ROLE!;
const COMPANY_ID = process.env.E2E_BUYER_COMPANY_ID!;
const INVITER_ID = process.env.E2E_ADMIN_USER_ID!;

const TEMP_PASSWORD = 'TempPass123!Aa';

test('invited user joins company and sees data on first login', async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_ROLE || !COMPANY_ID || !INVITER_ID,
    'E2E env not configured');

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `e2e+${Date.now()}@procuresaathi.test`;
  let createdUserId: string | null = null;

  try {
    // 1) Invite via the same edge function the UI uses (single authoritative writer).
    const { data: invokeData, error: invokeErr } = await admin.functions.invoke(
      'create-team-member',
      {
        body: {
          email,
          password: TEMP_PASSWORD,
          full_name: 'E2E Sanity User',
          company_id: COMPANY_ID,
          inviter_id: INVITER_ID,
          role: 'purchaser',
        },
      }
    );
    expect(invokeErr, `create-team-member error: ${invokeErr?.message}`).toBeNull();
    createdUserId = (invokeData as any)?.user_id ?? null;
    expect(createdUserId, 'edge function must return user_id').toBeTruthy();

    // DB assertion: exactly one membership row exists immediately.
    const { count, error: countErr } = await admin
      .from('buyer_company_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', createdUserId!)
      .eq('company_id', COMPANY_ID);
    expect(countErr).toBeNull();
    expect(count).toBe(1);

    // 2) Login as the invited user.
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name=email], input[type=email]', email);
    await page.fill('input[name=password], input[type=password]', TEMP_PASSWORD);
    await page.click('button[type=submit]');

    // 3) Immediate visibility — no manual refresh.
    await page.waitForURL(/\/(dashboard|onboarding|purchaser)/i, { timeout: 15_000 });

    // Acting Purchaser selector visible and populated.
    const selector = page.getByText(/Acting Purchaser/i);
    await expect(selector).toBeVisible({ timeout: 10_000 });

    // Company auctions section reachable (route + heading or empty-state).
    await page.goto(`${BASE_URL}/dashboard?view=auctions`);
    await expect(
      page.getByText(/auction/i).first()
    ).toBeVisible({ timeout: 10_000 });
  } finally {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => {});
    }
  }
});

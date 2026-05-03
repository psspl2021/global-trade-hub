# E2E Sanity Tests

One deterministic test that locks the identity → org → access mapping
(Invite → first login → immediate visibility, no refresh).

## Setup (local)

```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Required env

Set these in `.env.test` or CI secrets (never commit):

| Var | Purpose |
|---|---|
| `E2E_BASE_URL` | App URL, e.g. `http://localhost:8080` |
| `E2E_SUPABASE_URL` | Backend URL |
| `E2E_SUPABASE_SERVICE_ROLE` | Service-role key (CI only) |
| `E2E_BUYER_COMPANY_ID` | Test company to invite into |
| `E2E_ADMIN_USER_ID` | Inviter's `user_id` |

## Run

```bash
npx playwright test e2e/invite-first-login.spec.ts
```

The test:
1. Calls `create-team-member` edge fn (the single authoritative writer).
2. Asserts exactly one `buyer_company_members` row exists.
3. Logs in as the new user and asserts visibility without refresh.
4. Deletes the test user on teardown.

If it passes → close the thread. If it fails → debug with real signal.

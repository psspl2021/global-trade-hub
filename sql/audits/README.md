# Role Drift Audit

## Purpose

Detect mismatch between:

- `buyer_company_members.role` (source of truth for org structure)
- `user_roles.role` (permission layer)

## Run

```bash
psql $DATABASE_URL -f sql/audits/role_drift.sql
```

## Expected

- ✅ Zero rows → system healthy
- ❌ Any rows → drift detected

## Fix approach

For each row:

- Align `user_roles.role` with `buyer_company_members.role`
- OR re-save membership to trigger sync

## Notes

- Query is deterministic and idempotent
- Safe to run anytime (read-only)

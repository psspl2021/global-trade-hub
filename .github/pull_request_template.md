## Summary

<!-- What does this PR do? -->

## Role write (only if applicable)

If this PR intentionally writes to `user_roles` (INSERT / UPDATE / DELETE),
include a justified bypass flag in this description:

```
[allow-user_roles-write: <clear reason, e.g. "one-time backfill from membership">]
```

The CI `Role Write Guard` will fail without a reason.

## Checklist

- [ ] Tested locally
- [ ] No direct writes to `user_roles`

      OR explicitly justified with:

      [allow-user_roles-write: <reason>]

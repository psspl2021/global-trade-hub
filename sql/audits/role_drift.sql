-- role_drift.sql
-- Zero rows = healthy
-- Any rows = drift (must fix)

select
  m.user_id,
  m.company_id,
  m.role as member_role,
  ur.role as user_role
from buyer_company_members m
left join user_roles ur
  on ur.user_id = m.user_id
where m.is_active = true
  and (
    ur.role is null
    or ur.role <> m.role
  );

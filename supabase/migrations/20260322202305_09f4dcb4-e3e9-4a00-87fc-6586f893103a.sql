
create table public.credit_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company_name text,
  contact_name text,
  phone text,
  email text,
  turnover_range text,
  credit_required text,
  tenure text,
  city text,
  status text default 'new'
);

alter table public.credit_leads enable row level security;

create policy "Anyone can submit credit leads"
  on public.credit_leads for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated users can read credit leads"
  on public.credit_leads for select
  to authenticated
  using (true);

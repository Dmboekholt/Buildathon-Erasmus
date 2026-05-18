create table public.work_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text,
  company text,
  industry text,
  mode text check (mode in ('historical','current')),
  level int default 1,
  content jsonb,
  created_at timestamptz not null default now()
);

alter table public.work_products enable row level security;

create policy "Public read work_products"
  on public.work_products
  for select
  using (true);
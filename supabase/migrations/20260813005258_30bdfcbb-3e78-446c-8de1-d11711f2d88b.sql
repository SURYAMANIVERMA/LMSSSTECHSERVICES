create table public.seo_index_snapshots (
  id uuid primary key default gen_random_uuid(),
  site_url text not null,
  refreshed_at timestamptz not null default now(),
  sitemap jsonb,
  routes jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null
);

grant select on public.seo_index_snapshots to authenticated;
grant all on public.seo_index_snapshots to service_role;

alter table public.seo_index_snapshots enable row level security;

create policy "Admins can read seo snapshots"
on public.seo_index_snapshots
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index seo_index_snapshots_refreshed_at_idx on public.seo_index_snapshots (refreshed_at desc);
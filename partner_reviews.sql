-- Genco · İşletme yorumları ve puanları
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Bir kez çalıştırman yeterli; tekrar çalıştırmak zarar vermez.

create table if not exists public.partner_reviews (
  id           uuid primary key default gen_random_uuid(),
  partner_name text not null,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text check (comment is null or char_length(comment) <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (partner_name, user_id)
);

create index if not exists partner_reviews_partner_idx on public.partner_reviews (partner_name);

alter table public.partner_reviews enable row level security;

-- Giriş yapmış herkes yorumları okuyabilir
drop policy if exists "partner_reviews_select" on public.partner_reviews;
create policy "partner_reviews_select" on public.partner_reviews
  for select to authenticated using (true);

-- Herkes sadece kendi adına yorum ekler / günceller / siler
drop policy if exists "partner_reviews_insert_own" on public.partner_reviews;
create policy "partner_reviews_insert_own" on public.partner_reviews
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "partner_reviews_update_own" on public.partner_reviews;
create policy "partner_reviews_update_own" on public.partner_reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "partner_reviews_delete_own" on public.partner_reviews;
create policy "partner_reviews_delete_own" on public.partner_reviews
  for delete to authenticated using (auth.uid() = user_id);

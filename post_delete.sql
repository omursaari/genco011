-- Genco · Akış gönderisini tamamen silme
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- Kullanıcı kendi gönderisini sildiğinde gönderi, beğenileri ve yorumları
-- veritabanından tamamen silinir; hiçbir kullanıcıda bir daha görünmez.
-- Fonksiyon "security definer" çalışır: başkalarının beğeni/yorumlarını da
-- silebilmesi için RLS'yi aşar, ama sadece gönderinin sahibi (ya da admin) çağırabilir.

create or replace function public.delete_own_post(p_post_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın';
  end if;

  select user_id into v_owner from public.posts where id::text = p_post_id;
  if not found then
    return true; -- zaten silinmiş
  end if;

  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    into v_is_admin;

  if v_owner is distinct from auth.uid() and not v_is_admin then
    raise exception 'Bu gönderiyi silme yetkin yok';
  end if;

  delete from public.post_likes    where post_id::text = p_post_id;
  delete from public.post_comments where post_id::text = p_post_id;
  delete from public.posts         where id::text      = p_post_id;
  return true;
end;
$$;

revoke all on function public.delete_own_post(text) from public, anon;
grant execute on function public.delete_own_post(text) to authenticated;

-- Doğrudan tablo üzerinden silme için de kendi gönderisini silme izni
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated
  using (auth.uid() = user_id);

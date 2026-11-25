-- ============================================================
-- Skema database Agenda (Supabase / Postgres)
-- Jalankan seluruh file ini di Supabase > SQL Editor.
-- ============================================================

-- 1) Profil pengguna (1 baris per akun) -------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default 'Pengguna',
  nim           text not null default 'Belum diisi',
  jurusan       text not null default 'Belum diisi',
  avatar_color  text not null default 'orange',
  premium       boolean not null default false,
  premium_until timestamptz,
  created_at    timestamptz not null default now()
);

-- 2) Data aplikasi: pasangan key/value per pengguna ----------------------
-- Cocok dengan usePersistentState: key = 'tasks', 'points', 'streak', dst.
create table if not exists public.user_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 3) Pesanan pembayaran ---------------------------------------------------
create table if not exists public.orders (
  order_id   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_type  text not null check (item_type in ('premium','theme','hero','freeze','double')),
  item_id    text not null,
  name       text not null,
  amount     integer not null check (amount > 0),
  status     text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);

-- 4) Row Level Security ---------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.user_state enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "profil: baca milik sendiri" on public.profiles;
create policy "profil: baca milik sendiri" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profil: ubah milik sendiri" on public.profiles;
create policy "profil: ubah milik sendiri" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Pengguna TIDAK boleh mengubah kolom premium / premium_until sendiri.
revoke update on public.profiles from anon, authenticated;
grant  update (name, nim, jurusan, avatar_color) on public.profiles to authenticated;

drop policy if exists "state: kelola milik sendiri" on public.user_state;
create policy "state: kelola milik sendiri" on public.user_state
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and key <> 'premium');

drop policy if exists "orders: baca milik sendiri" on public.orders;
create policy "orders: baca milik sendiri" on public.orders
  for select using (user_id = auth.uid());
-- orders hanya ditulis oleh Edge Function (service role), jadi tanpa policy insert/update.

-- 5) Buat profil otomatis saat akun baru terdaftar ---------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Pemenuhan pesanan (dipanggil webhook setelah pembayaran lunas) -----------
-- Atomik dan idempoten: memanggilnya dua kali tidak memberi item dua kali.
create or replace function public.fulfill_order(p_order_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where order_id = p_order_id for update;
  if not found or o.status = 'paid' then
    return;
  end if;

  update public.orders set status = 'paid', paid_at = now() where order_id = p_order_id;

  if o.item_type = 'premium' then
    update public.profiles
       set premium = true,
           premium_until = greatest(coalesce(premium_until, now()), now()) + interval '30 days'
     where id = o.user_id;

  elsif o.item_type in ('theme', 'hero') then
    insert into public.user_state (user_id, key, value)
    values (
      o.user_id,
      case when o.item_type = 'theme' then 'ownedThemes' else 'ownedHeroes' end,
      case when o.item_type = 'theme'
           then jsonb_build_array('classic', o.item_id)
           else jsonb_build_array('wizard',  o.item_id) end
    )
    on conflict (user_id, key) do update
      set value = case
            when public.user_state.value ? o.item_id then public.user_state.value
            else public.user_state.value || to_jsonb(o.item_id)
          end,
          updated_at = now();

  elsif o.item_type = 'freeze' then
    insert into public.user_state (user_id, key, value)
    values (o.user_id, 'freezes', '2'::jsonb)
    on conflict (user_id, key) do update
      set value = to_jsonb(coalesce((public.user_state.value #>> '{}')::int, 0) + 1),
          updated_at = now();

  elsif o.item_type = 'double' then
    insert into public.user_state (user_id, key, value)
    values (o.user_id, 'doubleActive', 'true'::jsonb)
    on conflict (user_id, key) do update
      set value = 'true'::jsonb, updated_at = now();
  end if;
end $$;

-- Hanya service role (Edge Function) yang boleh memanggil fulfill_order.
revoke all on function public.fulfill_order(text) from public, anon, authenticated;
grant execute on function public.fulfill_order(text) to service_role;

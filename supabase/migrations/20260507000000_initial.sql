-- Enable UUID extension (already enabled on Supabase, but explicit is fine)
create extension if not exists "pgcrypto";

-- ─── USERS ──────────────────────────────────────────────────────────────────
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  apodo        text not null unique,
  created_at   timestamptz not null default now(),
  avatar_url   text,
  puntos_total int not null default 0,
  rango        text not null default 'principiante'
);
-- id = auth.uid() — set via Edge Function on first sign-in
alter table public.users enable row level security;
create policy "users: self read/write" on public.users
  for all using (auth.uid() = id);
create policy "users: friends can read" on public.users
  for select using (
    exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid() and f.friend_id = id
    )
  );

-- ─── STICKERS ────────────────────────────────────────────────────────────────
create table public.stickers (
  id          uuid primary key default gen_random_uuid(),
  numero      int  not null unique,
  codigo      text not null,
  equipo      text not null,
  jugador     text not null default '',
  seccion     text not null,
  es_especial boolean not null default false
);
alter table public.stickers enable row level security;
create policy "stickers: public read" on public.stickers for select using (true);

-- ─── USER_STICKERS ───────────────────────────────────────────────────────────
create table public.user_stickers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  sticker_id uuid not null references public.stickers(id),
  estado     text not null check (estado in ('falta', 'tengo', 'repetida')) default 'falta',
  cantidad   int  not null default 0,
  photo_path text,
  updated_at timestamptz not null default now(),
  unique (user_id, sticker_id)
);
alter table public.user_stickers enable row level security;
create policy "user_stickers: owner write" on public.user_stickers
  for all using (auth.uid() = user_id);
create policy "user_stickers: friends read" on public.user_stickers
  for select using (
    exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid() and f.friend_id = user_stickers.user_id
    )
  );
create index on public.user_stickers (user_id);
create index on public.user_stickers (sticker_id);

-- ─── TRADES ──────────────────────────────────────────────────────────────────
create table public.trades (
  id                   uuid primary key default gen_random_uuid(),
  ofertante_id         uuid not null references public.users(id) on delete cascade,
  lam_doy_id           uuid not null references public.stickers(id),
  lam_busco_id         uuid not null references public.stickers(id),
  estado               text not null check (estado in ('abierta', 'aceptada', 'cerrada')) default 'abierta',
  confirmed_ofertante  boolean not null default false,
  confirmed_proponente boolean not null default false,
  created_at           timestamptz not null default now()
);
alter table public.trades enable row level security;
create policy "trades: public read" on public.trades for select using (true);
create policy "trades: owner insert" on public.trades for insert with check (auth.uid() = ofertante_id);
create policy "trades: owner update" on public.trades for update using (auth.uid() = ofertante_id);
create index on public.trades (ofertante_id);
create index on public.trades (estado);

-- ─── TRADE_PROPOSALS ─────────────────────────────────────────────────────────
create table public.trade_proposals (
  id           uuid primary key default gen_random_uuid(),
  trade_id     uuid not null references public.trades(id) on delete cascade,
  proponente_id uuid not null references public.users(id) on delete cascade,
  estado       text not null check (estado in ('pendiente', 'aceptada', 'rechazada')) default 'pendiente',
  created_at   timestamptz not null default now()
);
alter table public.trade_proposals enable row level security;
create policy "proposals: parties read" on public.trade_proposals
  for select using (
    auth.uid() = proponente_id
    or exists (select 1 from public.trades t where t.id = trade_id and t.ofertante_id = auth.uid())
  );
create policy "proposals: proponente insert" on public.trade_proposals
  for insert with check (auth.uid() = proponente_id);
create policy "proposals: ofertante update" on public.trade_proposals
  for update using (
    exists (select 1 from public.trades t where t.id = trade_id and t.ofertante_id = auth.uid())
  );

-- ─── FRIENDSHIPS ─────────────────────────────────────────────────────────────
create table public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  friend_id  uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);
alter table public.friendships enable row level security;
create policy "friendships: self read/write" on public.friendships
  for all using (auth.uid() = user_id);
create index on public.friendships (user_id);

-- ─── FRIEND_INVITES ──────────────────────────────────────────────────────────
create table public.friend_invites (
  id         uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.users(id) on delete cascade,
  token      text not null unique default gen_random_uuid()::text,
  expires_at timestamptz not null default now() + interval '7 days',
  used_by    uuid references public.users(id),
  used_at    timestamptz
);
alter table public.friend_invites enable row level security;
create policy "invites: inviter read/insert" on public.friend_invites
  for all using (auth.uid() = inviter_id);
create policy "invites: public read by token" on public.friend_invites
  for select using (true);

-- ─── USER_POINTS ─────────────────────────────────────────────────────────────
create table public.user_points (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  puntos     int  not null,
  razon      text not null,
  created_at timestamptz not null default now()
);
alter table public.user_points enable row level security;
create policy "points: self read" on public.user_points for select using (auth.uid() = user_id);

-- ─── MISSIONS ────────────────────────────────────────────────────────────────
create table public.missions (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descripcion    text not null default '',
  metrica        text not null check (metrica in ('laminas_pegadas', 'intercambios', 'fotos')),
  valor_objetivo int  not null,
  puntos_bonus   int  not null,
  inicia_en      timestamptz not null,
  termina_en     timestamptz not null,
  activa         boolean not null default true
);
alter table public.missions enable row level security;
create policy "missions: public read" on public.missions for select using (true);

-- ─── MISSION_PROGRESS ────────────────────────────────────────────────────────
create table public.mission_progress (
  id           uuid primary key default gen_random_uuid(),
  mission_id   uuid not null references public.missions(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  valor_actual int  not null default 0,
  completada   boolean not null default false,
  completada_en timestamptz,
  unique (mission_id, user_id)
);
alter table public.mission_progress enable row level security;
create policy "mission_progress: self read" on public.mission_progress
  for select using (auth.uid() = user_id);

-- ─── DAILY_SPINS ─────────────────────────────────────────────────────────────
create table public.daily_spins (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  fecha     date not null default current_date,
  resultado text not null check (resultado in ('pista_lamina', 'puntos_bonus', 'doble_siguiente', 'nada')),
  valor     int  not null default 0,
  unique (user_id, fecha)
);
alter table public.daily_spins enable row level security;
create policy "spins: self read" on public.daily_spins for select using (auth.uid() = user_id);

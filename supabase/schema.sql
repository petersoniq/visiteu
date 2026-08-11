-- =========================================================
-- visitEU – kompletná databázová schéma pre Supabase
-- =========================================================

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. EU_CAPITALS
create table public.eu_capitals (
  id serial primary key,
  country text not null,
  country_code text not null unique,
  city text not null,
  slug text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  region text,
  created_at timestamptz not null default now()
);

-- 3. VISITS
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  capital_id integer not null references public.eu_capitals(id) on delete restrict,
  visit_date date not null,
  transport_mode text not null check (
    transport_mode in ('lietadlo','vlak','auto','autobus','bicykel','pešo','loď','iné')
  ),
  duration_nights integer not null default 0 check (duration_nights >= 0),
  notes text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_date_not_future check (visit_date <= current_date)
);

create index idx_visits_user_id on public.visits(user_id);
create index idx_visits_capital_id on public.visits(capital_id);

-- 4. VISIT_PHOTOS
create table public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index idx_visit_photos_visit_id on public.visit_photos(visit_id);

-- 5. BADGES + USER_BADGES
create table public.badges (
  id serial primary key,
  code text unique not null,
  name text not null,
  description text,
  icon text
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id integer not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- 6. ANNOUNCEMENTS
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.eu_capitals enable row level security;
alter table public.visits enable row level security;
alter table public.visit_photos enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.announcements enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- PROFILES
create policy "Profily sú verejne viditeľné" on public.profiles for select using (true);
create policy "Používateľ upravuje len svoj profil" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));
create policy "Admin môže upravovať/mazať akýkoľvek profil" on public.profiles for all using (public.is_admin());

-- EU_CAPITALS
create policy "Zoznam miest je verejný pre čítanie" on public.eu_capitals for select using (true);
create policy "Len admin spravuje zoznam miest" on public.eu_capitals for insert with check (public.is_admin());
create policy "Len admin upravuje mestá" on public.eu_capitals for update using (public.is_admin());
create policy "Len admin maže mestá" on public.eu_capitals for delete using (public.is_admin());

-- VISITS
create policy "Návštevy sú verejne viditeľné" on public.visits for select using (true);
create policy "Používateľ vytvára len svoje návštevy" on public.visits for insert with check (auth.uid() = user_id);
create policy "Používateľ upravuje len svoje návštevy" on public.visits for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Používateľ maže len svoje návštevy, admin hocijaké" on public.visits for delete
  using (auth.uid() = user_id or public.is_admin());

-- VISIT_PHOTOS
create policy "Fotky sú verejne viditeľné" on public.visit_photos for select using (true);
create policy "Používateľ pridáva fotky len k svojej návšteve" on public.visit_photos for insert
  with check (exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid()));
create policy "Používateľ maže vlastné fotky, admin hocijaké" on public.visit_photos for delete
  using (exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid()) or public.is_admin());

-- BADGES
create policy "Odznaky sú verejne viditeľné" on public.badges for select using (true);
create policy "Len admin spravuje odznaky" on public.badges for all using (public.is_admin());

-- USER_BADGES
create policy "Získané odznaky sú verejne viditeľné" on public.user_badges for select using (true);
create policy "Systém/admin prideľuje odznaky" on public.user_badges for insert
  with check (public.is_admin() or auth.uid() = user_id);

-- ANNOUNCEMENTS
create policy "Aktívne oznámenia vidia všetci" on public.announcements for select
  using (is_active = true or public.is_admin());
create policy "Len admin spravuje oznámenia" on public.announcements for insert with check (public.is_admin());
create policy "Len admin upravuje oznámenia" on public.announcements for update using (public.is_admin());
create policy "Len admin maže oznámenia" on public.announcements for delete using (public.is_admin());

-- =========================================================
-- GAMIFIKÁCIA – automatické udeľovanie odznakov
-- =========================================================
create or replace function public.check_and_award_badges()
returns trigger as $$
declare
  v_user_id uuid;
  v_visited_count integer;
begin
  v_user_id := coalesce(new.user_id, old.user_id);

  select count(distinct capital_id) into v_visited_count
  from public.visits where user_id = v_user_id;

  if v_visited_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'prve_kroky'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if v_visited_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'na_dobrej_ceste'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if v_visited_count >= 14 then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'polovica_cesty'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if v_visited_count >= 20 then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'europsky_expert'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if v_visited_count >= 27 then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'vsetky_hlavne_mesta'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Štokholm'),('Helsinki'),('Kodaň')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'seversky_badatel'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Vilnius'),('Riga'),('Tallinn')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'pobaltsky_tulak'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Sofia'),('Bukurešť'),('Záhreb'),('Ľubľana')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'balkansky_objavitel'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Madrid'),('Rím'),('Atény'),('Lisabon'),('Valletta'),('Nikózia')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'juzne_slnko'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Praha'),('Bratislava'),('Viedeň'),('Budapešť'),('Varšava'),('Berlín')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'stredoeuropsky_cestovatel'
    on conflict (user_id, badge_id) do nothing;
  end if;

  if not exists (
    select 1 from (values ('Paríž'),('Brusel'),('Amsterdam'),('Dublin'),('Luxemburg')) as required(city)
    where required.city not in (
      select c.city from public.visits v join public.eu_capitals c on c.id = v.capital_id where v.user_id = v_user_id
    )
  ) then
    insert into public.user_badges (user_id, badge_id)
    select v_user_id, id from public.badges where code = 'zapadoeuropsky_prieskumnik'
    on conflict (user_id, badge_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_visit_change_check_badges
  after insert or update on public.visits
  for each row execute procedure public.check_and_award_badges();

-- =========================================================
-- STORAGE POLICIES (spusti po vytvorení bucketu 'visit-photos')
-- =========================================================
create policy "Verejné čítanie fotiek z ciest"
on storage.objects for select
using (bucket_id = 'visit-photos');

create policy "Používateľ nahráva len do vlastného priečinka"
on storage.objects for insert
with check (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Používateľ maže vlastné fotky, admin hocijaké"
on storage.objects for delete
using (bucket_id = 'visit-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =========================================================
-- TRIPS – zoskupenie viacerých návštev miest do jedného výletu
-- (pridané v neskoršej migrácii, dokumentované tu pre kompletnosť schémy)
-- =========================================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_user_id on public.trips(user_id);

alter table public.visits add column trip_id uuid references public.trips(id) on delete set null;
create index idx_visits_trip_id on public.visits(trip_id);

alter table public.trips enable row level security;

create policy "Výlety sú verejne viditeľné"
  on public.trips for select using (true);

create policy "Používateľ vytvára len svoje výlety"
  on public.trips for insert with check (auth.uid() = user_id);

create policy "Používateľ upravuje len svoje výlety"
  on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Používateľ maže len svoje výlety"
  on public.trips for delete using (auth.uid() = user_id);

-- =========================================================
-- VISIT_PHOTOS.is_cover – editovateľná titulná fotka návštevy
-- (pridané v neskoršej migrácii, dokumentované tu pre kompletnosť schémy)
-- =========================================================
alter table public.visit_photos add column is_cover boolean not null default false;
create unique index idx_visit_photos_one_cover on public.visit_photos(visit_id) where is_cover;

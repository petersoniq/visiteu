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

-- =========================================================
-- ZDIEĽANIE VÝLETOV medzi viacerými používateľmi
-- (pridané v neskoršej migrácii, dokumentované tu pre kompletnosť schémy)
-- =========================================================
create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index idx_trip_members_user_id on public.trip_members(user_id);
alter table public.trip_members enable row level security;

create policy "Členstvo vo výletoch je viditeľné"
  on public.trip_members for select using (true);
create policy "Člen môže sám seba odobrať z výletu"
  on public.trip_members for delete using (user_id = auth.uid() and role <> 'owner');

create or replace function public.add_trip_owner_membership()
returns trigger as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.user_id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_created_add_owner
  after insert on public.trips
  for each row execute procedure public.add_trip_owner_membership();

create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz,
  max_uses integer default 20,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_trip_invites_trip_id on public.trip_invites(trip_id);
alter table public.trip_invites enable row level security;

create policy "Členovia výletu vidia jeho pozvánky"
  on public.trip_invites for select
  using (exists (select 1 from public.trip_members tm where tm.trip_id = trip_invites.trip_id and tm.user_id = auth.uid()));
create policy "Členovia výletu môžu vytvárať pozvánky"
  on public.trip_invites for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.trip_members tm where tm.trip_id = trip_invites.trip_id and tm.user_id = auth.uid())
  );
create policy "Tvorca môže zrušiť vlastnú pozvánku"
  on public.trip_invites for delete using (created_by = auth.uid());

create or replace function public.join_trip_via_invite(p_token text)
returns table(trip_id uuid, trip_name text) as $$
declare
  v_invite record;
begin
  if auth.uid() is null then
    raise exception 'Musíš byť prihlásený.';
  end if;

  select * into v_invite from public.trip_invites where token = p_token for update;

  if v_invite is null then
    raise exception 'Pozvánka neexistuje alebo bola zrušená.';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Platnosť pozvánky vypršala.';
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'Pozvánka už dosiahla maximálny počet použití.';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_invite.trip_id, auth.uid(), 'member')
  on conflict (trip_id, user_id) do nothing;

  update public.trip_invites set use_count = use_count + 1 where id = v_invite.id;

  return query select t.id, t.name from public.trips t where t.id = v_invite.trip_id;
end;
$$ language plpgsql security definer;

grant execute on function public.join_trip_via_invite(text) to authenticated;

-- Upravovať výlet smie ktorýkoľvek člen, mazať len vlastník
drop policy "Používateľ upravuje len svoje výlety" on public.trips;
drop policy "Používateľ maže len svoje výlety" on public.trips;

create policy "Členovia môžu upravovať výlet"
  on public.trips for update
  using (exists (select 1 from public.trip_members tm where tm.trip_id = trips.id and tm.user_id = auth.uid()))
  with check (exists (select 1 from public.trip_members tm where tm.trip_id = trips.id and tm.user_id = auth.uid()));

create policy "Len vlastník maže výlet"
  on public.trips for delete
  using (exists (select 1 from public.trip_members tm where tm.trip_id = trips.id and tm.user_id = auth.uid() and tm.role = 'owner'));

-- trip_id na návšteve sa dá nastaviť len na výlet, ktorého je používateľ členom
drop policy "Používateľ vytvára len svoje návštevy" on public.visits;
drop policy "Používateľ upravuje len svoje návštevy" on public.visits;

create policy "Používateľ vytvára len svoje návštevy"
  on public.visits for insert
  with check (
    auth.uid() = user_id
    and (trip_id is null or exists (select 1 from public.trip_members tm where tm.trip_id = visits.trip_id and tm.user_id = auth.uid()))
  );

create policy "Používateľ upravuje len svoje návštevy"
  on public.visits for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (trip_id is null or exists (select 1 from public.trip_members tm where tm.trip_id = visits.trip_id and tm.user_id = auth.uid()))
  );

-- =========================================================
-- VISIT_COMPANIONS – spolucestujúci pridaní k návšteve mesta
-- (pridané v neskoršej migrácii, dokumentované tu pre kompletnosť schémy)
--
-- Meno je verejné, e-mail sa nikde v appke nezobrazuje - slúži len na
-- spárovanie s existujúcim účtom cez find_user_id_by_email() (SECURITY
-- DEFINER, keďže auth.users nie je bežne čitateľná). Pri spárovaní sa
-- spustí mirror_visit_for_companion(), ktorá spárovanému používateľovi
-- vytvorí (alebo doplní) JEHO VLASTNÚ návštevu rovnakého mesta v rovnaký
-- deň so zoznamom spolucestujúcich z oboch strán - presne to appka sľubuje:
-- "uvidí rovnaké navštívené mesto vo svojom prehľade aj so spolucestujúcimi".
-- =========================================================
create table public.visit_companions (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  name text not null,
  email text,
  matched_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_visit_companions_visit_id on public.visit_companions(visit_id);
create index idx_visit_companions_matched_user on public.visit_companions(matched_user_id);

alter table public.visit_companions enable row level security;

create policy "Spolucestujúci sú viditeľní"
  on public.visit_companions for select using (true);
create policy "Vlastník návštevy pridáva spolucestujúcich"
  on public.visit_companions for insert
  with check (exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid()));
create policy "Vlastník návštevy upravuje spolucestujúcich"
  on public.visit_companions for update
  using (exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid()));
create policy "Vlastník návštevy maže spolucestujúcich"
  on public.visit_companions for delete
  using (exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid()));

create or replace function public.find_user_id_by_email(p_email text)
returns uuid as $$
  select id from auth.users
  where lower(email) = lower(p_email) and email_confirmed_at is not null
  limit 1;
$$ language sql security definer stable;

create or replace function public.mirror_visit_for_companion(p_original_visit_id uuid, p_target_user_id uuid)
returns void as $$
declare
  v_original public.visits%rowtype;
  v_target_visit_id uuid;
  v_owner_username text;
  c record;
begin
  select * into v_original from public.visits where id = p_original_visit_id;
  if v_original is null or v_original.user_id = p_target_user_id then
    return;
  end if;

  select id into v_target_visit_id
  from public.visits
  where user_id = p_target_user_id
    and capital_id = v_original.capital_id
    and visit_date = v_original.visit_date
  limit 1;

  if v_target_visit_id is null then
    insert into public.visits (user_id, capital_id, visit_date, transport_mode, duration_nights)
    values (p_target_user_id, v_original.capital_id, v_original.visit_date, v_original.transport_mode, v_original.duration_nights)
    returning id into v_target_visit_id;
  end if;

  select username into v_owner_username from public.profiles where id = v_original.user_id;

  if v_owner_username is not null and not exists (
    select 1 from public.visit_companions where visit_id = v_target_visit_id and matched_user_id = v_original.user_id
  ) then
    insert into public.visit_companions (visit_id, name, matched_user_id)
    values (v_target_visit_id, v_owner_username, v_original.user_id);
  end if;

  for c in
    select name, email, matched_user_id from public.visit_companions
    where visit_id = p_original_visit_id and (matched_user_id is null or matched_user_id <> p_target_user_id)
  loop
    if not exists (
      select 1 from public.visit_companions
      where visit_id = v_target_visit_id
        and coalesce(matched_user_id::text, lower(email), name) = coalesce(c.matched_user_id::text, lower(c.email), c.name)
    ) then
      insert into public.visit_companions (visit_id, name, email, matched_user_id)
      values (v_target_visit_id, c.name, c.email, c.matched_user_id);
    end if;
  end loop;
end;
$$ language plpgsql security definer;

create or replace function public.handle_companion_email_match()
returns trigger as $$
begin
  if new.email is not null then
    new.matched_user_id := public.find_user_id_by_email(new.email);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_companion_email_match
  before insert or update of email on public.visit_companions
  for each row execute procedure public.handle_companion_email_match();

create or replace function public.handle_companion_after_match()
returns trigger as $$
begin
  if new.matched_user_id is not null then
    perform public.mirror_visit_for_companion(new.visit_id, new.matched_user_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_companion_matched_mirror
  after insert or update of matched_user_id on public.visit_companions
  for each row execute procedure public.handle_companion_after_match();

-- handle_new_user() rozšírená o retroaktívne spárovanie (ak sa niekto
-- zaregistruje s e-mailom, ktorý bol už predtým zadaný ako spolucestujúci)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  c record;
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );

  for c in
    select id, visit_id from public.visit_companions
    where lower(email) = lower(new.email) and matched_user_id is null
  loop
    update public.visit_companions set matched_user_id = new.id where id = c.id;
    perform public.mirror_visit_for_companion(c.visit_id, new.id);
  end loop;

  return new;
end;
$$ language plpgsql security definer;

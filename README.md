# visitEU 🇪🇺

Webová aplikácia na sledovanie a zaznamenávanie návštev hlavných miest Európskej únie. Každý používateľ si po registrácii vedie vlastný cestovateľský denník s mapou, fotogalériou a gamifikáciou.

## Funkcie

- 🔐 Registrácia a prihlásenie (Supabase Auth)
- 🗺️ Interaktívna mapa 27 hlavných miest EÚ (Leaflet) s farebným rozlíšením navštívených/nenavštívených miest
- 📓 Cestovateľský denník – dátum, doprava, dĺžka pobytu, poznámky, hodnotenie
- 📸 Fotogaléria k návštevám (Supabase Storage)
- 📊 Štatistiky – progress bar, prehľad podľa regiónov
- 🏅 Gamifikácia – 11 automaticky udeľovaných odznakov
- 🛡️ Admin panel – správa používateľov, moderácia obsahu, globálne oznámenia

## Tech Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Mapa:** React-Leaflet / OpenStreetMap
- **Hosting:** GitHub Pages (cez GitHub Actions)
- **Release management:** release-please (Conventional Commits → automatický CHANGELOG a GitHub Release)

## Databázová schéma

SQL súbory na nastavenie Supabase projektu sú v priečinku [`supabase/`](./supabase):

1. `schema.sql` – tabuľky, RLS politiky, trigger na odznaky, storage politiky
2. `seed_capitals.sql` – 27 hlavných miest EÚ so súradnicami
3. `seed_badges.sql` – definícia gamifikačných odznakov

Spusti ich v tomto poradí v Supabase SQL Editore. Pred `schema.sql` (storage časť) vytvor v **Storage** bucket s názvom `visit-photos` (public).

## Lokálny vývoj

```bash
npm install
cp .env.example .env.local   # doplň vlastné Supabase kľúče
npm run dev
```

## Nastavenie prvého admina

Po registrácii v aplikácii spusti v Supabase SQL Editore:

```sql
update public.profiles set is_admin = true where username = 'tvoja_prezyvka';
```

## Deployment

Automatický cez GitHub Actions (`.github/workflows/deploy.yml`) pri každom push do `main` → GitHub Pages.

V nastaveniach repozitára treba:
1. `Settings → Pages → Source` → **GitHub Actions**
2. `Settings → Secrets and variables → Actions` → pridať `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`

## Release management

Commity dodržiavajú [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`...). Workflow `release-please.yml` automaticky pripravuje PR s aktualizovanou verziou a `CHANGELOG.md`; po zlúčení sa vytvorí GitHub Release s tagom.

## Licencia

MIT

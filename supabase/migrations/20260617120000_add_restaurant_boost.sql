-- Schéma restaurants : alignement url/website + boost
-- À exécuter dans Supabase SQL Editor si la migration admin échoue.

-- Colonne legacy `url` (certaines bases Prisma / anciennes migrations)
alter table public.restaurants add column if not exists url text;

-- Colonne app `website`
alter table public.restaurants add column if not exists website text;

-- Synchroniser url ↔ website
update public.restaurants
set url = website
where (url is null or url = '') and website is not null and website <> '';

update public.restaurants
set website = url
where (website is null or website = '') and url is not null and url <> '';

-- url NOT NULL : valeur de secours Maps pour les lignes sans site
update public.restaurants
set url = 'https://www.google.com/maps/search/?api=1&query=' ||
  replace(trim(coalesce(name, '') || ' ' || coalesce(address, '') || ' ' || coalesce(city, 'Nantes')), ' ', '+')
where url is null or url = '';

-- Coup de projecteur
alter table public.restaurants add column if not exists boost_until timestamptz;
alter table public.restaurants add column if not exists boost_tier smallint not null default 1;

create index if not exists restaurants_boost_until_idx
  on public.restaurants (boost_until)
  where boost_until is not null;

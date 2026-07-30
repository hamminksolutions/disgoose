create table albums (
  id uuid primary key default gen_random_uuid(),
  mb_release_group_id text unique not null,
  spotify_id text unique,
  lastfm_url text,
  title text not null,
  artist text not null,
  cover_url text,
  cached_at timestamptz not null default now()
);

-- Albums are a shared cache written only by our server (service_role);
-- no direct client access is needed, so RLS stays off and only
-- service_role gets table privileges.
grant select, insert, update on albums to service_role;

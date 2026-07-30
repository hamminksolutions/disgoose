create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  username text unique not null,
  created_at timestamptz not null default now()
);

-- Written only by our server (service_role) right after auth.signUp;
-- no direct client access needed, so RLS stays off, same as albums.
grant select, insert, update on users to service_role;

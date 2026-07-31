create table ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  album_id uuid not null references albums (id),
  score integer not null check (score between 10 and 100), -- tenths: 85 = 8.5
  listen_method text not null check (
    listen_method in ('spotify', 'cd', 'vinyl', 'streaming_other', 'other')
  ),
  review_text text check (char_length(review_text) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, album_id)
);

create index ratings_user_id_created_at_idx on ratings (user_id, created_at);

-- Written only by our server (service_role); no direct client access
-- needed, so RLS stays off, same as albums/users.
grant select, insert, update, delete on ratings to service_role;

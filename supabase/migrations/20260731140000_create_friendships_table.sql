create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users (id) on delete cascade,
  addressee_id uuid not null references users (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id != addressee_id),
  unique (requester_id, addressee_id)
);

create index friendships_addressee_id_status_idx on friendships (addressee_id, status);

-- Written only by our server (service_role); no direct client access
-- needed, so RLS stays off, same as albums/users/ratings.
grant select, insert, update, delete on friendships to service_role;

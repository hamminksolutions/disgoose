create table rate_limits (
  key text not null,
  bucket timestamptz not null,
  count integer not null default 1,
  primary key (key, bucket)
);

create index rate_limits_bucket_idx on rate_limits (bucket);

-- Written only by our server (service_role) via increment_rate_limit below;
-- no direct client access needed, same as albums/users/ratings/friendships.
-- No delete grant: rows are only ever removed by increment_rate_limit's own
-- cleanup, nothing else deletes from this table.
grant select, insert, update on rate_limits to service_role;

-- Atomically bumps the counter for (key, window) and returns the new count,
-- so concurrent callers across serverless instances always see a
-- consistent, race-free total (issue #21, branch
-- research/rate-limiting-vercel, Option 3: Postgres UPSERT is atomic under
-- concurrent writers). Also prunes rows whose window closed over an hour
-- ago on every call — unlike Redis, Postgres has no built-in TTL expiry,
-- and this table would otherwise grow forever.
create function increment_rate_limit(p_key text, p_window_seconds int)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  delete from rate_limits where bucket < now() - interval '1 hour';

  insert into rate_limits (key, bucket, count)
  values (
    p_key,
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds),
    1
  )
  on conflict (key, bucket) do update set count = rate_limits.count + 1
  returning count into new_count;

  return new_count;
end;
$$;

grant execute on function increment_rate_limit(text, int) to service_role;

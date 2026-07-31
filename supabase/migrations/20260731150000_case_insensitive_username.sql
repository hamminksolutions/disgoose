-- The plain `unique` constraint on username is case-sensitive, so "NielsH"
-- and "nielsh" could both register. Replace it with a generated, always-
-- lowercase column and a unique index on that — safe to query with a plain
-- `.eq()` (unlike `ilike`, which would treat `_`/`%` in real usernames as
-- wildcards).
alter table users drop constraint users_username_key;
alter table users add column username_lower text generated always as (lower(username)) stored;
create unique index users_username_lower_idx on users (username_lower);

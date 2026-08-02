alter table ratings
  add column owned boolean not null default false;

-- Owned is only meaningful for physical formats (matches the prototype's
-- isPhysical gating); other listen methods can never be marked owned.
alter table ratings
  add constraint ratings_owned_requires_physical
  check (not owned or listen_method in ('vinyl', 'cd'));

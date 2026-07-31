insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

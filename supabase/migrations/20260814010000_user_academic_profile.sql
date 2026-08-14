-- Academic profile fields on users

alter table public.users
  add column if not exists cover_url varchar(500),
  add column if not exists career varchar(120),
  add column if not exists university varchar(120),
  add column if not exists semester integer;

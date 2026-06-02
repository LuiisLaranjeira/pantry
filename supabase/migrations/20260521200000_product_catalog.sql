alter table products add column if not exists country text;

alter table households add column if not exists country text;
alter table households add column if not exists grouped_view boolean not null default false;

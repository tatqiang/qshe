-- Brands table for material inventory
create table public.brands (
  id uuid not null default gen_random_uuid(),
  brand_title character varying(200) not null,
  brand_title_th character varying(200) null,
  note text null,
  is_active boolean null default true,
  created_by character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint brands_pkey primary key (id),
  constraint brands_brand_title_key unique (brand_title)
) tablespace pg_default;

create index if not exists idx_brands_active on public.brands using btree (is_active) tablespace pg_default;
create index if not exists idx_brands_title on public.brands using btree (brand_title) tablespace pg_default;

comment on table public.brands is 'Product brands for material inventory';
comment on column public.brands.brand_title is 'Brand name in English';
comment on column public.brands.brand_title_th is 'Brand name in Thai';
comment on column public.brands.note is 'Additional notes about the brand';

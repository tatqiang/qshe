-- Migration: Add brands table and brand_id to material_inventory
-- Date: 2025-11-16

-- Step 1: Create brands table
create table if not exists public.brands (
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
);

create index if not exists idx_brands_active on public.brands using btree (is_active);
create index if not exists idx_brands_title on public.brands using btree (brand_title);

comment on table public.brands is 'Product brands for material inventory';
comment on column public.brands.brand_title is 'Brand name in English';
comment on column public.brands.brand_title_th is 'Brand name in Thai';
comment on column public.brands.note is 'Additional notes about the brand';

-- Step 2: Add brand_id column to material_inventory
alter table public.material_inventory 
  add column if not exists brand_id uuid null;

-- Step 3: Add foreign key constraint
alter table public.material_inventory 
  add constraint material_inventory_brand_id_fkey 
  foreign key (brand_id) references brands (id) on delete set null;

-- Step 4: Create index
create index if not exists idx_material_inventory_brand 
  on public.material_inventory using btree (brand_id);

-- Step 5: Enable RLS on brands table
alter table public.brands enable row level security;

-- Step 6: Create RLS policies for brands (same pattern as other material tables)
drop policy if exists "Allow SELECT on brands" on brands;
drop policy if exists "Allow INSERT on brands" on brands;
drop policy if exists "Allow UPDATE on brands" on brands;
drop policy if exists "Allow DELETE on brands" on brands;

create policy "Allow SELECT on brands"
  on brands for select using (true);

create policy "Allow INSERT on brands"
  on brands for insert with check (true);

create policy "Allow UPDATE on brands"
  on brands for update using (true) with check (true);

create policy "Allow DELETE on brands"
  on brands for delete using (true);

-- Verification
select 
  'brands' as table_name,
  count(*) as policy_count
from pg_policies
where tablename = 'brands';

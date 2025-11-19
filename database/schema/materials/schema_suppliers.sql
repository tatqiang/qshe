-- Suppliers: Links companies to supplier-specific attributes
-- A company can be a supplier, subcontractor, customer, or multiple roles
create table public.suppliers (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  supplier_code character varying(50) null,
  
  -- Supplier-specific attributes
  payment_terms character varying(100) null, -- e.g., "Net 30", "COD", "50% advance"
  delivery_lead_days integer null, -- Standard delivery time in days
  is_preferred boolean not null default false,
  credit_limit numeric(15,2) null,
  
  -- Contact info (can override company defaults for purchasing)
  contact_person character varying(255) null,
  contact_phone character varying(50) null,
  contact_email character varying(255) null,
  
  status character varying(20) not null default 'active',
  notes text null,
  
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint suppliers_pkey primary key (id),
  constraint suppliers_company_id_fkey foreign key (company_id) references companies (id) on delete cascade,
  constraint suppliers_company_id_key unique (company_id), -- One supplier record per company
  constraint suppliers_status_check check (status in ('active', 'inactive', 'suspended'))
) tablespace pg_default;

create index if not exists idx_suppliers_company on public.suppliers using btree (company_id) tablespace pg_default;
create index if not exists idx_suppliers_status on public.suppliers using btree (status) tablespace pg_default;
create index if not exists idx_suppliers_code on public.suppliers using btree (supplier_code) tablespace pg_default;

comment on table public.suppliers is 'Supplier-specific attributes linked to companies table';
comment on column public.suppliers.company_id is 'FK to companies - one supplier record per company';
comment on column public.suppliers.supplier_code is 'Internal supplier code for purchasing/accounting';
comment on column public.suppliers.is_preferred is 'Preferred supplier flag for priority in selection';
comment on column public.suppliers.credit_limit is 'Maximum credit allowed for purchases';

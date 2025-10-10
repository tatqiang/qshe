-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- RECENT CHANGES (October 2025):
-- ✅ REMOVED: patrols table (empty, superseded by safety_patrols)
-- ✅ UPDATED: positions.type changed from VARCHAR to ENUM (position_type_enum: 'internal' | 'external')
-- ✅ ACTIVE: safety_patrols is the primary patrol management table

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  address text,
  contact_person character varying,
  contact_email character varying,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.file_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_name character varying NOT NULL,
  file_path text NOT NULL,
  file_type character varying,
  file_size bigint,
  entity_type USER-DEFINED,
  entity_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT file_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT file_metadata_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.issue_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid,
  type USER-DEFINED,
  file_metadata_id uuid,
  annotations jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT issue_photos_pkey PRIMARY KEY (id),
  CONSTRAINT issue_photos_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.patrol_issues(id),
  CONSTRAINT issue_photos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT issue_photos_file_metadata_id_fkey FOREIGN KEY (file_metadata_id) REFERENCES public.file_metadata(id)
);
CREATE TABLE public.patrol_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patrol_id uuid,
  title character varying NOT NULL,
  description text,
  location character varying,
  severity USER-DEFINED DEFAULT 'medium'::issue_severity_enum,
  status USER-DEFINED DEFAULT 'open'::issue_status_enum,
  assignee_id uuid,
  reporter_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  closed_by uuid,
  CONSTRAINT patrol_issues_pkey PRIMARY KEY (id),
  CONSTRAINT patrol_issues_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id),
  -- CONSTRAINT patrol_issues_patrol_id_fkey FOREIGN KEY (patrol_id) REFERENCES public.patrols(id), -- REMOVED: patrols table deleted
  CONSTRAINT patrol_issues_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  CONSTRAINT patrol_issues_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id)
);
-- REMOVED: patrols table (empty, superseded by safety_patrols)
-- The safety_patrols table is now the primary table for patrol management
CREATE TABLE public.pre_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  user_type USER-DEFINED NOT NULL,
  invited_by uuid,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'registered'::character varying::text, 'expired'::character varying::text])),
  invitation_token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  registered_at timestamp with time zone,
  registered_user_id uuid,
  CONSTRAINT pre_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT pre_registrations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id),
  CONSTRAINT pre_registrations_registered_user_id_fkey FOREIGN KEY (registered_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  role character varying DEFAULT 'member'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'member'::character varying]::text[])),
  project_position character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'active'::project_status_enum,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  position character varying,
  user_type USER-DEFINED DEFAULT 'internal'::user_type_enum,
  status USER-DEFINED DEFAULT 'pending'::user_status_enum,
  face_descriptors jsonb,
  profile_photo_url text,
  company_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
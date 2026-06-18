-- ============================================================
-- 0001_initial_schema.sql
-- Phase 1 schema for career-syncer
-- ============================================================

-- --------------------------------------------------------
-- Enum
-- --------------------------------------------------------
create type entity_type as enum (
  'work_experience',
  'project',
  'education',
  'skill',
  'certification'
);

-- --------------------------------------------------------
-- updated_at trigger function (shared)
-- --------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- --------------------------------------------------------
-- Source-of-truth tables
-- --------------------------------------------------------

create table work_experiences (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  company     text not null,
  location    text,
  start_date  date not null,
  end_date    date,
  is_current  boolean default false,
  description text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger trg_work_experiences_updated_at
  before update on work_experiences
  for each row execute function set_updated_at();


create table projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  url         text,
  tech_stack  text[] default '{}',
  start_date  date,
  end_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();


create table education (
  id             uuid primary key default gen_random_uuid(),
  institution    text not null,
  degree         text not null,
  field_of_study text,
  start_date     date,
  end_date       date,
  gpa            numeric,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create trigger trg_education_updated_at
  before update on education
  for each row execute function set_updated_at();


create table skills (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text,
  proficiency_level text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create trigger trg_skills_updated_at
  before update on skills
  for each row execute function set_updated_at();


create table certifications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  issuer      text,
  issue_date  date,
  expiry_date date,
  url         text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger trg_certifications_updated_at
  before update on certifications
  for each row execute function set_updated_at();

-- --------------------------------------------------------
-- Resume tables
-- --------------------------------------------------------

create table resumes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  template_id text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger trg_resumes_updated_at
  before update on resumes
  for each row execute function set_updated_at();


create table resume_items (
  id          uuid primary key default gen_random_uuid(),
  resume_id   uuid not null references resumes (id) on delete cascade,
  entity_type entity_type not null,
  entity_id   uuid not null,
  position    int not null default 0,
  section     text not null,
  created_at  timestamptz default now()
);

create index idx_resume_items_resume_id
  on resume_items (resume_id);

create index idx_resume_items_entity
  on resume_items (entity_type, entity_id);

-- --------------------------------------------------------
-- LinkedIn table
-- --------------------------------------------------------

create table linkedin_profile (
  id         uuid primary key default gen_random_uuid(),
  headline   text,
  summary    text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_linkedin_profile_updated_at
  before update on linkedin_profile
  for each row execute function set_updated_at();

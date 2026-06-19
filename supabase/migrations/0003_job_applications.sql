-- 0003_job_applications.sql — Phase 2: application tracking Kanban
-- Requires migration 0002_crm_contacts.sql to be applied first.

create table job_applications (
  id         uuid primary key default gen_random_uuid(),
  company    text not null,
  role       text not null,
  status     text not null default 'Wishlist',
  applied_at date,
  url        text,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_job_applications_updated_at
  before update on job_applications
  for each row execute function set_updated_at();

create table application_contacts (
  application_id uuid not null references job_applications(id) on delete cascade,
  contact_id     uuid not null references contacts(id) on delete cascade,
  primary key (application_id, contact_id)
);

create index idx_application_contacts_application_id on application_contacts(application_id);
create index idx_application_contacts_contact_id on application_contacts(contact_id);
